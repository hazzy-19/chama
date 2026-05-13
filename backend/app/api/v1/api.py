import ipaddress
import json
import time
from uuid import uuid4
from decimal import Decimal

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.db.session import SessionLocal, get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import (
    BalanceResponse,
    GenericResponse,
    MpesaInitRequest,
    MpesaInitiateResponse,
    TransactionCreate,
    TransactionRead,
    WithdrawalRequest,
)

api_router = APIRouter()

MPESA_OAUTH_URL = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
MPESA_STATUS_URL = "https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query"

_mpesa_token_cache = {"token": None, "expires_at": 0}

async def verify_id_token(id_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token}, timeout=10)
        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization token")
        payload = response.json()
        if payload.get("aud") != settings.FIREBASE_CLIENT_ID:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token audience mismatch")
        return payload

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")

    token = auth_header.removeprefix("Bearer ").strip()
    payload = await verify_id_token(token)

    firebase_uid = payload.get("sub")
    email = payload.get("email")
    if not firebase_uid or not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth payload")

    user = db.query(User).filter(User.id == firebase_uid).first()
    if not user:
        user = User(
            id=firebase_uid,
            email=email,
            full_name=payload.get("name"),
            phone_number=payload.get("phone_number"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user

def validate_mpesa_source_ip(request: Request) -> None:
    raw_cidrs = settings.MPESA_WHITELIST_CIDRS
    if not raw_cidrs:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="M-Pesa whitelist is not configured")

    client_host = request.client.host if request.client else None
    if not client_host:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unable to determine callback source")

    try:
        remote_ip = ipaddress.ip_address(client_host)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid callback IP address")

    for cidr in [cidr.strip() for cidr in raw_cidrs.split(",") if cidr.strip()]:
        try:
            network = ipaddress.ip_network(cidr, strict=False)
        except ValueError:
            continue
        if remote_ip in network:
            return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Callback IP is not authorized")

async def get_mpesa_access_token() -> str | None:
    if not settings.MPESA_CONSUMER_KEY or not settings.MPESA_CONSUMER_SECRET:
        return None

    if _mpesa_token_cache["token"] and time.time() < _mpesa_token_cache["expires_at"]:
        return _mpesa_token_cache["token"]

    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.get(MPESA_OAUTH_URL, auth=(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET), timeout=10)
            if token_response.status_code == 200:
                data = token_response.json()
                _mpesa_token_cache["token"] = data.get("access_token")
                _mpesa_token_cache["expires_at"] = time.time() + 3500
                return _mpesa_token_cache["token"]
        except Exception:
            pass
    return None

async def query_mpesa_transaction_status(mpesa_receipt_number: str) -> dict | None:
    access_token = await get_mpesa_access_token()
    if not access_token or not mpesa_receipt_number:
        return None

    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    payload = {
        "CommandID": "TransactionStatusQuery",
        "PartyA": settings.MPESA_SHORTCODE,
        "IdentifierType": "4",
        "Remarks": "Status check",
        "QueueTimeOutURL": settings.MPESA_CALLBACK_URL,
        "ResultURL": settings.MPESA_CALLBACK_URL,
        "TransactionID": mpesa_receipt_number,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(MPESA_STATUS_URL, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
    return None

async def process_pending_transaction(transaction_id: str, callback_payload: dict | None = None) -> None:
    db = SessionLocal()
    try:
        transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
        if not transaction or transaction.verified or transaction.status == "failed":
            return

        confirmed = False
        if callback_payload and str(callback_payload.get("ResultCode", "")) == "0":
            amount = callback_payload.get("Amount") or callback_payload.get("amount")
            if amount is not None and float(amount) == float(transaction.amount):
                confirmed = True

        if not confirmed:
            status_payload = await query_mpesa_transaction_status(transaction.mpesa_receipt_number or "")
            if status_payload:
                transaction_status = status_payload.get("TransactionStatus") or status_payload.get("ResultCode")
                amount = status_payload.get("Amount") or status_payload.get("amount")
                if str(transaction_status).lower() in {"completed", "0", "success"} and amount is not None and float(amount) == float(transaction.amount):
                    confirmed = True
                else:
                    transaction.status = "failed"
                    transaction.verified = False
                    db.commit()
                    return

        if confirmed:
            transaction.status = "confirmed"
            transaction.verified = True
            db.commit()
    finally:
        db.close()

def calculate_balance(db: Session, user_id: str) -> tuple[Decimal, Decimal, list[Transaction]]:
    deposits = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id, 
        Transaction.status == "confirmed", 
        Transaction.verified == True,
        Transaction.type == "deposit"
    ).scalar() or Decimal("0.0")

    withdrawals = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id, 
        Transaction.status.in_(["confirmed", "pending_approval"]),
        Transaction.type == "withdrawal"
    ).scalar() or Decimal("0.0")

    real_balance = Decimal(deposits) - Decimal(withdrawals)
    
    pending_deposits = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.status == "pending",
        Transaction.type == "deposit"
    ).scalar() or Decimal("0.0")

    pending_transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.status.in_(["pending", "pending_approval"])
    ).order_by(Transaction.created_at.desc()).all()

    return real_balance, Decimal(pending_deposits), pending_transactions

@api_router.get("/test", status_code=200)
def test():
    return {"message": "Test endpoint is working"}

@api_router.post("/mpesa/initiate", response_model=MpesaInitiateResponse, status_code=status.HTTP_201_CREATED)
def initiate_mpesa_stk_push(
    init_request: MpesaInitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaction_id = f"stk_{uuid4().hex}"
    db_transaction = Transaction(
        transaction_id=transaction_id,
        user_id=current_user.id,
        phone=init_request.phone,
        amount=init_request.amount,
        type="deposit",
        currency="KSH",
        status="initiated",
        verified=False,
        description=init_request.description,
    )
    db.add(db_transaction)
    try:
        db.commit()
        db.refresh(db_transaction)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Unable to create STK Push initiation.")

    return MpesaInitiateResponse(
        transaction_id=db_transaction.transaction_id,
        amount=db_transaction.amount,
        phone=db_transaction.phone or init_request.phone,
        status=db_transaction.status,
        message="STK Push initiated. Awaiting Safaricom callback for confirmation.",
    )

@api_router.post("/mpesa/callback", response_model=GenericResponse, status_code=status.HTTP_202_ACCEPTED)
async def mpesa_callback(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    validate_mpesa_source_ip(request)
    payload = await request.json()
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid callback payload")

    checkout_request_id = payload.get("CheckoutRequestID") or payload.get("checkout_request_id")
    receipt = payload.get("MpesaReceiptNumber") or payload.get("mpesa_receipt_number")
    if not checkout_request_id or not receipt:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Callback payload missing required identifiers")

    existing_receipt = db.query(Transaction).filter(Transaction.mpesa_receipt_number == receipt).first()
    if existing_receipt and existing_receipt.transaction_id != checkout_request_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate receipt number detected")

    transaction = db.query(Transaction).filter(Transaction.transaction_id == checkout_request_id).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No matching STK Push initiation found")

    transaction.mpesa_receipt_number = receipt
    transaction.status = "pending"
    transaction.callback_payload = json.dumps(payload)
    db.commit()
    db.refresh(transaction)

    background_tasks.add_task(process_pending_transaction, transaction.transaction_id, payload)
    return GenericResponse(detail="Callback received and pending verification started.")

@api_router.get("/user/balance", response_model=BalanceResponse)
def get_user_balance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    real_balance, pending_balance, pending_transactions = calculate_balance(db, current_user.id)
    return BalanceResponse(
        real_balance=real_balance,
        pending_balance=pending_balance,
        pending_transactions=pending_transactions,
        savings_target=Decimal("5000.0"),
        guardian_mode=True,
        withdrawal_locked=pending_balance > 0,
    )

@api_router.post("/withdrawals", response_model=GenericResponse)
async def create_withdrawal_request(
    withdrawal: WithdrawalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    real_balance, pending_balance, _ = calculate_balance(db, current_user.id)
    if pending_balance > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Withdrawals are locked until pending funds are cleared.")
    if withdrawal.amount > real_balance:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requested amount exceeds confirmed balance.")

    transaction_id = f"wd_{uuid4().hex}"
    db_transaction = Transaction(
        transaction_id=transaction_id,
        user_id=current_user.id,
        amount=withdrawal.amount,
        type="withdrawal",
        currency="KSH",
        status="pending_approval",
        verified=False,
        description=withdrawal.reason,
    )
    db.add(db_transaction)
    db.commit()

    if settings.WHATSAPP_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID and settings.GUARDIAN_PHONE_NUMBER:
        whatsapp_payload = {
            "messaging_product": "whatsapp",
            "to": settings.GUARDIAN_PHONE_NUMBER,
            "type": "text",
            "text": {
                "body": f"Withdrawal request from {current_user.email}: KES {withdrawal.amount:.2f}. Reason: {withdrawal.reason}. Reply YES to approve."
            },
        }
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"https://graph.facebook.com/v16.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages",
                    json=whatsapp_payload,
                    headers={"Authorization": f"Bearer {settings.WHATSAPP_TOKEN}", "Content-Type": "application/json"},
                    timeout=10,
                )
            except Exception:
                pass

    return GenericResponse(detail="Withdrawal request sent to guardian via WhatsApp.")

@api_router.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    try:
        messages = payload.get("entry", [])[0].get("changes", [])[0].get("value", {}).get("messages", [])
        if not messages:
            return {"status": "ignored"}
        
        message_body = messages[0].get("text", {}).get("body", "").strip().lower()
        
        # Find the latest pending withdrawal
        pending_withdrawal = db.query(Transaction).filter(
            Transaction.type == "withdrawal",
            Transaction.status == "pending_approval"
        ).order_by(Transaction.created_at.desc()).first()
        
        if not pending_withdrawal:
            return {"status": "no pending withdrawals"}
            
        if message_body in ["yes", "approve", "y"]:
            pending_withdrawal.status = "confirmed"
            pending_withdrawal.guardian_approved = "approved"
            pending_withdrawal.verified = True
            db.commit()
            return {"status": "approved"}
        elif message_body in ["no", "decline", "n"]:
            pending_withdrawal.status = "failed"
            pending_withdrawal.guardian_approved = "declined"
            db.commit()
            return {"status": "declined"}
            
    except Exception:
        pass
    
    return {"status": "ok"}

async def process_all_pending_transactions() -> int:
    db = SessionLocal()
    try:
        pending_transactions = db.query(Transaction).filter(
            Transaction.type == "deposit",
            Transaction.status == "pending", 
            Transaction.verified == False
        ).all()
        for transaction in pending_transactions:
            await process_pending_transaction(transaction.transaction_id)
        return len(pending_transactions)
    finally:
        db.close()

@api_router.post("/mpesa/process-pending", response_model=GenericResponse)
async def process_pending_transactions(db: Session = Depends(get_db)):
    count = await process_all_pending_transactions()
    return GenericResponse(detail=f"Processed {count} pending transactions.")

@api_router.post("/transactions", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: TransactionCreate, db: Session = Depends(get_db)):
    db_transaction = Transaction(**transaction.dict())
    db.add(db_transaction)
    try:
        db.commit()
        db.refresh(db_transaction)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Transaction with ID {transaction.transaction_id} already exists.",
        )
    return db_transaction

@api_router.get("/transactions", response_model=list[TransactionRead])
def list_transactions(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    transactions = db.query(Transaction).order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    return transactions

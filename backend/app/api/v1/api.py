import ipaddress
import json
from uuid import uuid4
from decimal import Decimal

import httpx
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging

from app.core.config import settings
from app.core.mpesa import mpesa_client, MpesaAPIError, ValidationError
from app.db.session import SessionLocal, get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.models.goal import Goal
from app.models.guardian import Guardian
from app.schemas.transaction import (
    BalanceResponse,
    GenericResponse,
    MpesaInitRequest,
    MpesaInitiateResponse,
    StkStatusResponse,
    TransactionCreate,
    TransactionRead,
    WithdrawalRequest,
)
from app.schemas.goal import GoalCreate, GoalRead
from app.schemas.guardian import GuardianCreate, GuardianRead

logger = logging.getLogger("app.api.v1")

# ---------------------------------------------------------------------------
# Firebase Admin SDK — initialise once at import time
# ---------------------------------------------------------------------------
if not firebase_admin._apps:
    _cred = credentials.Certificate({
        "type": "service_account",
        "project_id": settings.FIREBASE_PROJECT_ID,
        "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
        "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
        "client_email": settings.FIREBASE_CLIENT_EMAIL,
        "client_id": settings.FIREBASE_CLIENT_ID,
        "auth_uri": settings.FIREBASE_AUTH_URI,
        "token_uri": settings.FIREBASE_TOKEN_URI,
        "auth_provider_x509_cert_url": settings.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": settings.FIREBASE_CLIENT_X509_CERT_URL,
    })
    firebase_admin.initialize_app(_cred)

api_router = APIRouter()

# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def verify_id_token(id_token: str) -> dict:
    """Verify a Firebase ID token using the Admin SDK."""
    try:
        return firebase_auth.verify_id_token(id_token)
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
        )
    except firebase_auth.InvalidIdTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {e}",
        )


async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )

    token = auth_header.removeprefix("Bearer ").strip()
    payload = verify_id_token(token)  # now synchronous — no await needed

    firebase_uid = payload.get("uid")   # Admin SDK uses 'uid', not 'sub'
    email = payload.get("email")
    if not firebase_uid or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid auth payload",
        )

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

# ---------------------------------------------------------------------------
# Balance helper
# ---------------------------------------------------------------------------

def calculate_balance(
    db: Session, user_id: str
) -> tuple[Decimal, Decimal, list[Transaction]]:
    deposits = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.status == "confirmed",
            Transaction.verified == True,
            Transaction.type == "deposit",
        )
        .scalar()
        or Decimal("0.0")
    )

    withdrawals = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.status.in_(["confirmed", "pending_approval"]),
            Transaction.type == "withdrawal",
        )
        .scalar()
        or Decimal("0.0")
    )

    real_balance = Decimal(deposits) - Decimal(withdrawals)

    pending_deposits = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.status == "pending",
            Transaction.type == "deposit",
        )
        .scalar()
        or Decimal("0.0")
    )

    pending_transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.status.in_(["pending", "pending_approval"]),
        )
        .order_by(Transaction.created_at.desc())
        .all()
    )

    return real_balance, Decimal(pending_deposits), pending_transactions

# ---------------------------------------------------------------------------
# Utility endpoints
# ---------------------------------------------------------------------------

@api_router.get("/test", status_code=200)
def test():
    return {"message": "Test endpoint is working"}

# ---------------------------------------------------------------------------
# M-Pesa — Initiate STK Push
# ---------------------------------------------------------------------------

@api_router.post(
    "/mpesa/initiate",
    response_model=MpesaInitiateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def initiate_mpesa_stk_push(
    init_request: MpesaInitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Validate inputs, call Safaricom's STK Push API, and persist a pending
    transaction record. Returns the CheckoutRequestID so the frontend can poll
    for the result.
    """
    # Validate phone & amount eagerly so we surface errors before hitting Safaricom
    try:
        formatted_phone = mpesa_client.validate_phone(str(init_request.phone))
        mpesa_client.validate_amount(float(init_request.amount))
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    # Generate an internal transaction ID (used as AccountReference if none provided)
    transaction_id = f"stk_{uuid4().hex}"

    # Actually call Safaricom
    try:
        safaricom_resp = await mpesa_client.initiate_stk_push(
            phone=formatted_phone,
            amount=float(init_request.amount),
            transaction_id=transaction_id,
            account_reference=transaction_id,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except MpesaAPIError as exc:
        logger.error("Safaricom STK Push failed: %s", exc.message)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"M-Pesa error: {exc.message}",
        )

    checkout_request_id = safaricom_resp["CheckoutRequestID"]

    # Persist a "pending" record — status will be updated via callback
    db_transaction = Transaction(
        transaction_id=transaction_id,
        checkout_request_id=checkout_request_id,
        user_id=current_user.id,
        phone=formatted_phone,
        amount=init_request.amount,
        type="deposit",
        currency="KSH",
        status="pending",
        verified=False,
        description=init_request.description,
    )
    db.add(db_transaction)
    try:
        db.commit()
        db.refresh(db_transaction)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Transaction record conflict — please try again.",
        )

    logger.info(
        "STK Push initiated. transaction_id=%s checkout_request_id=%s",
        transaction_id,
        checkout_request_id,
    )

    return MpesaInitiateResponse(
        transaction_id=transaction_id,
        checkout_request_id=checkout_request_id,
        amount=db_transaction.amount,
        phone=formatted_phone,
        status="pending",
        message="STK Push sent. Check your phone and enter your M-Pesa PIN.",
    )

# ---------------------------------------------------------------------------
# M-Pesa — Callback from Safaricom
# ---------------------------------------------------------------------------

@api_router.post("/mpesa/callback", status_code=status.HTTP_200_OK)
async def mpesa_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Receive the STK Push result from Safaricom.

    Safaricom expects us to always return {"ResultCode": 0, "ResultDesc": "Success"}
    even if we encounter an internal error — otherwise it retries indefinitely.

    Result codes:
        0    — success
        1032 — cancelled by user
        any other — failed (e.g. wrong PIN, insufficient funds)
    """
    # Always ack Safaricom successfully
    ack = {"ResultCode": 0, "ResultDesc": "Success"}

    try:
        payload = await request.json()
    except Exception:
        logger.warning("mpesa_callback: could not parse request body")
        return ack

    logger.info("mpesa_callback raw payload: %s", json.dumps(payload))

    try:
        body = payload.get("Body", {})
        stk_callback = body.get("stkCallback", {})

        if not stk_callback:
            logger.error("mpesa_callback: no stkCallback key in payload")
            return ack

        checkout_id = stk_callback.get("CheckoutRequestID")
        result_code = stk_callback.get("ResultCode")   # int
        result_desc = stk_callback.get("ResultDesc", "")

        if not checkout_id:
            logger.error("mpesa_callback: no CheckoutRequestID in payload")
            return ack

        # Find the transaction by Safaricom's CheckoutRequestID
        transaction = (
            db.query(Transaction)
            .filter(Transaction.checkout_request_id == checkout_id)
            .first()
        )

        if not transaction:
            logger.warning("mpesa_callback: no transaction for CheckoutRequestID=%s", checkout_id)
            return ack

        # Persist the raw payload and result info
        transaction.callback_payload = json.dumps(payload)
        transaction.result_code = str(result_code)
        transaction.result_desc = result_desc

        if result_code == 0:
            # ----- SUCCESS -----
            metadata_items = (
                stk_callback.get("CallbackMetadata", {}).get("Item", [])
            )
            receipt = None
            amount_paid = None
            phone_paid = None

            for item in metadata_items:
                name = item.get("Name")
                value = item.get("Value")
                if name == "MpesaReceiptNumber":
                    receipt = value
                elif name == "Amount":
                    amount_paid = value
                elif name == "PhoneNumber":
                    phone_paid = str(value) if value else None

            transaction.mpesa_receipt_number = receipt
            transaction.status = "confirmed"
            transaction.verified = True
            if phone_paid:
                transaction.phone = phone_paid

            logger.info(
                "mpesa_callback: confirmed. receipt=%s amount=%s phone=%s",
                receipt,
                amount_paid,
                phone_paid,
            )

        elif result_code == 1032:
            # ----- CANCELLED by user -----
            transaction.status = "cancelled"
            transaction.verified = False
            logger.info("mpesa_callback: user cancelled. CheckoutRequestID=%s", checkout_id)

        else:
            # ----- FAILED (wrong PIN, insufficient funds, timeout, etc.) -----
            transaction.status = "failed"
            transaction.verified = False
            logger.warning(
                "mpesa_callback: failed. code=%s desc=%s", result_code, result_desc
            )

        db.commit()

    except Exception as exc:
        logger.exception("mpesa_callback: unexpected error — %s", exc)
        # Still return ack so Safaricom doesn't retry

    return ack

# ---------------------------------------------------------------------------
# M-Pesa — Poll status by CheckoutRequestID
# ---------------------------------------------------------------------------

@api_router.get(
    "/mpesa/stk-status/{checkout_request_id}",
    response_model=StkStatusResponse,
)
def get_stk_status(
    checkout_request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Poll the result of an STK Push by CheckoutRequestID.
    The frontend should poll this every 3–5 seconds until status is not 'pending'.
    """
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.checkout_request_id == checkout_request_id,
            Transaction.user_id == current_user.id,
        )
        .first()
    )

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    return StkStatusResponse(
        transaction_id=transaction.transaction_id,
        checkout_request_id=checkout_request_id,
        status=transaction.status,
        result_code=transaction.result_code,
        result_desc=transaction.result_desc,
        mpesa_receipt_number=transaction.mpesa_receipt_number,
        amount=transaction.amount,
        verified=transaction.verified,
    )

# ---------------------------------------------------------------------------
# Balance
# ---------------------------------------------------------------------------

@api_router.get("/user/balance", response_model=BalanceResponse)
def get_user_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    real_balance, pending_balance, pending_transactions = calculate_balance(
        db, current_user.id
    )
    return BalanceResponse(
        real_balance=real_balance,
        pending_balance=pending_balance,
        pending_transactions=pending_transactions,
        savings_target=Decimal("5000.0"),
        guardian_mode=True,
        withdrawal_locked=pending_balance > 0,
    )

# ---------------------------------------------------------------------------
# Goals
# ---------------------------------------------------------------------------

@api_router.post("/goals", response_model=GoalRead)
def create_goal(
    goal_in: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = Goal(**goal_in.dict(), user_id=current_user.id)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@api_router.get("/goals", response_model=list[GoalRead])
def list_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .order_by(Goal.created_at.desc())
        .all()
    )

# ---------------------------------------------------------------------------
# Guardians
# ---------------------------------------------------------------------------

@api_router.post("/guardians", response_model=GenericResponse)
async def request_guardian(
    guardian_in: GuardianCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if (
        current_user.phone_number
        and guardian_in.phone_number == current_user.phone_number
    ):
        raise HTTPException(
            status_code=400, detail="You cannot be your own guardian."
        )

    existing = (
        db.query(Guardian)
        .filter(
            Guardian.user_id == current_user.id,
            Guardian.phone_number == guardian_in.phone_number,
        )
        .first()
    )
    if existing:
        return GenericResponse(detail="Guardian already requested or active.")

    guardian = Guardian(**guardian_in.dict(), user_id=current_user.id)
    db.add(guardian)
    db.commit()
    db.refresh(guardian)

    # WhatsApp notifications paused — will be re-enabled once WhatsApp API is connected.
    # TODO: send guardian invite via WhatsApp to guardian.phone_number
    logger.info(
        "[WhatsApp PAUSED] Would notify guardian %s (%s) for user %s",
        guardian.name,
        guardian.phone_number,
        current_user.email,
    )

    return GenericResponse(detail="Guardian requested successfully.")

# ---------------------------------------------------------------------------
# Withdrawals
# ---------------------------------------------------------------------------

@api_router.post("/withdrawals", response_model=GenericResponse)
async def create_withdrawal_request(
    withdrawal: WithdrawalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    real_balance, pending_balance, _ = calculate_balance(db, current_user.id)
    if pending_balance > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Withdrawals are locked until pending deposits are cleared.",
        )
    if withdrawal.amount > real_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested amount exceeds your confirmed balance.",
        )

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

    # WhatsApp notifications paused — will be re-enabled once WhatsApp API is connected.
    # TODO: notify guardian via WhatsApp with approval request
    logger.info(
        "[WhatsApp PAUSED] Would notify guardian for withdrawal: user=%s amount=%s",
        current_user.email,
        withdrawal.amount,
    )

    return GenericResponse(detail="Withdrawal request submitted. Guardian will be notified once WhatsApp is connected.")

# ---------------------------------------------------------------------------
# WhatsApp webhook (guardian responses)
# ---------------------------------------------------------------------------

@api_router.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.json()
    try:
        messages = (
            payload.get("entry", [])[0]
            .get("changes", [])[0]
            .get("value", {})
            .get("messages", [])
        )
        if not messages:
            return {"status": "ignored"}

        message_body = messages[0].get("text", {}).get("body", "").strip().lower()
        sender_phone = messages[0].get("from", "")

        # Guardian acceptance
        if message_body in ["yes", "accept", "y"]:
            pending_guardian = (
                db.query(Guardian)
                .filter(
                    Guardian.phone_number.like(f"%{sender_phone[-9:]}%"),
                    Guardian.status == "pending",
                )
                .order_by(Guardian.created_at.desc())
                .first()
            )
            if pending_guardian:
                pending_guardian.status = "accepted"
                db.commit()
                return {"status": "guardian accepted"}

        # Withdrawal approval / decline
        pending_withdrawal = (
            db.query(Transaction)
            .filter(
                Transaction.type == "withdrawal",
                Transaction.status == "pending_approval",
            )
            .order_by(Transaction.created_at.desc())
            .first()
        )

        if pending_withdrawal:
            if message_body in ["yes", "approve", "y"]:
                pending_withdrawal.status = "confirmed"
                pending_withdrawal.guardian_approved = "approved"
                pending_withdrawal.verified = True
                db.commit()
                return {"status": "withdrawal approved"}
            elif message_body in ["no", "decline", "n"]:
                pending_withdrawal.status = "failed"
                pending_withdrawal.guardian_approved = "declined"
                db.commit()
                return {"status": "withdrawal declined"}

    except Exception:
        pass

    return {"status": "ok"}

# ---------------------------------------------------------------------------
# Transaction listing (admin/debug)
# ---------------------------------------------------------------------------

@api_router.post(
    "/transactions",
    response_model=TransactionRead,
    status_code=status.HTTP_201_CREATED,
)
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
def list_transactions(
    skip: int = 0, limit: int = 50, db: Session = Depends(get_db)
):
    return (
        db.query(Transaction)
        .order_by(Transaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

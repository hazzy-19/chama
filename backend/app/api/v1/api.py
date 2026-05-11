from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionRead

api_router = APIRouter()

@api_router.get("/test", status_code=200)
def test():
    return {"message": "Test endpoint is working"}

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
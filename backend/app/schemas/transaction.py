from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class TransactionBase(BaseModel):
    transaction_id: str = Field(..., description="M-Pesa transaction ID, e.g. UEB90408B8")
    amount: Decimal = Field(..., gt=0, description="Transaction amount in shillings")
    type: str = Field("deposit", description="deposit or withdrawal")
    currency: str = Field("KSH", description="Currency code")
    status: str = Field("initiated", description="Transaction status")
    description: str | None = Field(None, description="Optional transaction description")
    guardian_approved: str | None = Field("pending", description="Guardian approval state")

class TransactionCreate(TransactionBase):
    user_id: str
    phone: str | None = None

class TransactionRead(TransactionBase):
    user_id: str
    phone: str | None
    mpesa_receipt_number: str | None
    verified: bool
    created_at: datetime

    class Config:
        orm_mode = True

class MpesaInitRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Expected amount for the STK Push")
    phone: str = Field(..., min_length=10, max_length=15, description="Customer phone number in international format")
    description: str | None = Field(None, description="Optional deposit description")

class MpesaInitiateResponse(BaseModel):
    transaction_id: str
    amount: Decimal
    phone: str | None
    status: str
    message: str

class BalanceResponse(BaseModel):
    real_balance: Decimal
    pending_balance: Decimal
    pending_transactions: list[TransactionRead]
    savings_target: Decimal
    guardian_mode: bool
    withdrawal_locked: bool

class WithdrawalRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Withdrawal amount")
    reason: str = Field(..., min_length=10, description="Reason for the withdrawal")

class GenericResponse(BaseModel):
    detail: str

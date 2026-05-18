from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    transaction_id: str = Field(..., description="Internal transaction ID")
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
    checkout_request_id: str | None
    mpesa_receipt_number: str | None
    result_code: str | None
    result_desc: str | None
    verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MpesaInitRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Deposit amount in KES")
    phone: str = Field(..., min_length=9, max_length=15, description="Customer phone number")
    description: str | None = Field(None, description="Optional deposit description")


class MpesaInitiateResponse(BaseModel):
    transaction_id: str
    checkout_request_id: str
    amount: Decimal
    phone: str
    status: str
    message: str


class StkStatusResponse(BaseModel):
    """Response for polling STK Push result by checkout_request_id."""
    transaction_id: str
    checkout_request_id: str
    status: str
    result_code: str | None
    result_desc: str | None
    mpesa_receipt_number: str | None
    amount: Decimal
    verified: bool


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

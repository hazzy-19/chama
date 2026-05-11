from pydantic import BaseModel, Field
from datetime import datetime

class TransactionBase(BaseModel):
    transaction_id: str = Field(..., description="M-Pesa transaction ID, e.g. UEB90408B8")
    amount: float = Field(..., gt=0, description="Transaction amount in shillings")
    currency: str = Field("KSH", description="Currency code")
    status: str = Field("pending", description="Transaction status")
    description: str | None = Field(None, description="Optional transaction description")
    guardian_approved: str | None = Field("pending", description="Guardian approval state")

class TransactionCreate(TransactionBase):
    pass

class TransactionRead(TransactionBase):
    created_at: datetime

    class Config:
        orm_mode = True

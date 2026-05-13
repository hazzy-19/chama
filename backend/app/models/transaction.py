from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Numeric, ForeignKey, String, Text
from app.db.session import Base

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    phone = Column(String, nullable=True)
    mpesa_receipt_number = Column(String, unique=True, nullable=True, index=True)
    amount = Column(Numeric(precision=12, scale=2), nullable=False)
    type = Column(String, default="deposit", nullable=False)
    currency = Column(String, default="KSH", nullable=False)
    status = Column(String, nullable=False, default="initiated")
    verified = Column(Boolean, nullable=False, default=False)
    description = Column(String, nullable=True)
    guardian_approved = Column(String, nullable=False, default="pending")
    callback_payload = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Numeric, ForeignKey, String, Text
from app.db.session import Base

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True, index=True)
    # CheckoutRequestID returned by Safaricom on STK Push acceptance
    checkout_request_id = Column(String, unique=True, nullable=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    phone = Column(String, nullable=True)
    mpesa_receipt_number = Column(String, unique=True, nullable=True, index=True)
    amount = Column(Numeric(precision=12, scale=2), nullable=False)
    type = Column(String, default="deposit", nullable=False)
    currency = Column(String, default="KSH", nullable=False)
    # Status lifecycle: initiated → pending → confirmed | cancelled | failed
    status = Column(String, nullable=False, default="initiated")
    verified = Column(Boolean, nullable=False, default=False)
    description = Column(String, nullable=True)
    guardian_approved = Column(String, nullable=False, default="pending")
    # Raw Safaricom result code from callback ("0" = success, "1032" = cancelled, etc.)
    result_code = Column(String, nullable=True)
    # Human-readable result description from Safaricom callback
    result_desc = Column(String, nullable=True)
    callback_payload = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

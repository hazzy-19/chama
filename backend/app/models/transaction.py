from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String
from app.db.session import Base

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(String, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="KSH", nullable=False)
    status = Column(String, nullable=False, default="pending")
    description = Column(String, nullable=True)
    guardian_approved = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

from sqlalchemy import Boolean, Column, String
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # Firebase UID
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    phone_number = Column(String, nullable=True)  # For M-Pesa/WhatsApp integration
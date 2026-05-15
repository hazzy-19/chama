from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base
import uuid

class Guardian(Base):
    __tablename__ = "guardians"

    id = Column(String, primary_key=True, index=True, default=lambda: f"grd_{uuid.uuid4().hex}")
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending") # pending, accepted, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())

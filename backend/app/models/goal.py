from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base
import uuid

class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, index=True, default=lambda: f"goal_{uuid.uuid4().hex}")
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    target_date = Column(String, nullable=False) # dd-mm-yyyy format
    color_theme = Column(String, nullable=False, default="teal")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

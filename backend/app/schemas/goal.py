from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GoalBase(BaseModel):
    name: str
    target_amount: float
    target_date: str
    color_theme: Optional[str] = "teal"

class GoalCreate(GoalBase):
    pass

class GoalRead(GoalBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

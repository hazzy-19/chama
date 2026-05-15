from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GuardianBase(BaseModel):
    name: str
    phone_number: str

class GuardianCreate(GuardianBase):
    pass

class GuardianRead(GuardianBase):
    id: str
    user_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

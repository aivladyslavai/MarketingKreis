from pydantic import BaseModel
from typing import Optional


class ActivityBase(BaseModel):
    title: str
    type: Optional[str] = None
    status: Optional[str] = None
    budget: Optional[float] = None
    expected_output: Optional[str] = None
    weight: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(ActivityBase):
    pass


class ActivityOut(ActivityBase):
    id: int

    class Config:
        from_attributes = True




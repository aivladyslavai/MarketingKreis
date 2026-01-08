from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    color: str = Field(..., min_length=3, max_length=32, description="Hex or CSS color string")
    position: int = Field(0, ge=0, le=100)


class UserCategoryCreate(UserCategoryBase):
    pass


class UserCategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    position: Optional[int] = None


class UserCategoryOut(UserCategoryBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True




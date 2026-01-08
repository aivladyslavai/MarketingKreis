from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime


class ContactBase(BaseModel):
    company_id: Optional[int] = Field(None, ge=1)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    position: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None

    @validator('first_name', 'last_name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    company_id: Optional[int] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    notes: Optional[str] = None


class ContactOut(BaseModel):
    id: int
    company_id: Optional[int] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


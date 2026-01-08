from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime


class CompanyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Company name")
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    # Use plain string here; stricter validation is applied only on input schemas
    email: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = Field("active", pattern="^(active|inactive|prospect)$")
    revenue: Optional[int] = Field(None, ge=0, description="Annual revenue in CHF")
    employees: Optional[int] = Field(None, ge=0, description="Number of employees")
    notes: Optional[str] = None

    @validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Company name cannot be empty')
        return v.strip()

    @validator("email", pre=True)
    def normalize_email(cls, v):
        """
        Allow empty string in DB / payloads by normalizing it to None
        before EmailStr validation. This prevents ResponseValidationError
        when a company has "" stored as email.
        """
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return v


class CompanyCreate(CompanyBase):
    # For create payloads, enforce proper email format if provided
    email: Optional[EmailStr] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    revenue: Optional[int] = None
    employees: Optional[int] = None
    notes: Optional[str] = None


class CompanyOut(CompanyBase):
    # Response schema: allow raw string email (already normalized by validator)
    email: Optional[str] = None
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


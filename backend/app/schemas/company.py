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

    # Optional "main contact" fields (kept inside company for quick CRM)
    contact_person_name: Optional[str] = Field(None, max_length=255)
    contact_person_position: Optional[str] = Field(None, max_length=100)
    # Use plain string here; stricter validation is applied only on input schemas
    contact_person_email: Optional[str] = None
    contact_person_phone: Optional[str] = Field(None, max_length=50)

    # Other optional business info
    vat_id: Optional[str] = Field(None, max_length=64, description="VAT/UID number")
    lead_source: Optional[str] = Field(None, max_length=100, description="How this company was acquired")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    next_follow_up_at: Optional[datetime] = None
    linkedin_url: Optional[str] = Field(None, max_length=255)
    tags: Optional[str] = Field(None, max_length=255, description="Comma-separated tags")

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

    @validator("contact_person_email", pre=True)
    def normalize_contact_person_email(cls, v):
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return v

    @validator("priority", "status", pre=True)
    def normalize_enums(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            vv = v.strip().lower()
            if not vv:
                return None
            return vv
        return v


class CompanyCreate(CompanyBase):
    # For create payloads, enforce proper email format if provided
    email: Optional[EmailStr] = None
    contact_person_email: Optional[EmailStr] = None


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

    contact_person_name: Optional[str] = None
    contact_person_position: Optional[str] = None
    contact_person_email: Optional[str] = None
    contact_person_phone: Optional[str] = None

    vat_id: Optional[str] = None
    lead_source: Optional[str] = None
    priority: Optional[str] = None
    next_follow_up_at: Optional[datetime] = None
    linkedin_url: Optional[str] = None
    tags: Optional[str] = None


class CompanyOut(CompanyBase):
    # Response schema: allow raw string email (already normalized by validator)
    email: Optional[str] = None
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


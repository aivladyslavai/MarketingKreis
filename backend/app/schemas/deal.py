from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class DealBase(BaseModel):
    company_id: Optional[int] = Field(None, ge=1)
    contact_id: Optional[int] = Field(None, ge=1)
    title: str = Field(..., min_length=1, max_length=255)
    value: Optional[float] = Field(0.0, ge=0.0, description="Deal value in CHF")
    stage: Optional[str] = Field("lead", pattern="^(lead|qualified|proposal|negotiation|won|lost)$")
    probability: Optional[int] = Field(0, ge=0, le=100, description="Win probability (0-100%)")
    expected_close_date: Optional[datetime] = None
    owner: str = Field(..., min_length=1, max_length=100, description="Deal owner")
    notes: Optional[str] = None

    @validator('title')
    def title_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Deal title cannot be empty')
        return v.strip()


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    company_id: Optional[int] = None
    title: Optional[str] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    probability: Optional[int] = None
    expected_close_date: Optional[datetime] = None
    notes: Optional[str] = None


class DealOut(DealBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


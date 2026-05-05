from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[str] = Field("TODO", max_length=50)
    priority: Optional[str] = Field("MEDIUM", max_length=20)
    due_at: Optional[datetime] = None
    company_id: Optional[int] = None
    project_id: Optional[int] = None
    activity_id: Optional[int] = None
    event_id: Optional[int] = None
    owner_id: Optional[int] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[str] = Field(None, max_length=50)
    priority: Optional[str] = Field(None, max_length=20)
    due_at: Optional[datetime] = None
    company_id: Optional[int] = None
    project_id: Optional[int] = None
    activity_id: Optional[int] = None
    event_id: Optional[int] = None
    owner_id: Optional[int] = None


class TaskOut(TaskBase):
    id: int
    organization_id: int
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

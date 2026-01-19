from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.content_task import ContentTaskStatus, ContentTaskPriority


class ContentTaskOwnerOut(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        from_attributes = True


class ContentTaskBase(BaseModel):
    title: str = Field(..., max_length=255)
    channel: str = Field("Website", max_length=100)
    format: Optional[str] = Field(None, max_length=100)
    status: ContentTaskStatus = Field(ContentTaskStatus.TODO)
    priority: ContentTaskPriority = Field(ContentTaskPriority.MEDIUM)
    notes: Optional[str] = Field(None, max_length=2000)
    deadline: Optional[datetime] = None
    activity_id: Optional[int] = None
    content_item_id: Optional[int] = None
    recurrence: Optional[dict] = None


class ContentTaskCreate(ContentTaskBase):
    # Admin can assign tasks to other users or leave unassigned (None).
    owner_id: Optional[int] = None


class ContentTaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    channel: Optional[str] = Field(None, max_length=100)
    format: Optional[str] = Field(None, max_length=100)
    status: Optional[ContentTaskStatus] = None
    priority: Optional[ContentTaskPriority] = None
    notes: Optional[str] = Field(None, max_length=2000)
    deadline: Optional[datetime] = None
    activity_id: Optional[int] = None
    content_item_id: Optional[int] = None
    recurrence: Optional[dict] = None
    owner_id: Optional[int] = None


class ContentTaskOut(ContentTaskBase):
    id: int
    owner_id: Optional[int] = None
    owner: Optional[ContentTaskOwnerOut] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True




from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.content_task import ContentTaskStatus, ContentTaskPriority


class ContentTaskBase(BaseModel):
    title: str = Field(..., max_length=255)
    channel: str = Field("Website", max_length=100)
    format: Optional[str] = Field(None, max_length=100)
    status: ContentTaskStatus = Field(ContentTaskStatus.TODO)
    priority: ContentTaskPriority = Field(ContentTaskPriority.MEDIUM)
    notes: Optional[str] = Field(None, max_length=2000)
    deadline: Optional[datetime] = None
    activity_id: Optional[int] = None


class ContentTaskCreate(ContentTaskBase):
    pass


class ContentTaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    channel: Optional[str] = Field(None, max_length=100)
    format: Optional[str] = Field(None, max_length=100)
    status: Optional[ContentTaskStatus] = None
    priority: Optional[ContentTaskPriority] = None
    notes: Optional[str] = Field(None, max_length=2000)
    deadline: Optional[datetime] = None
    activity_id: Optional[int] = None


class ContentTaskOut(ContentTaskBase):
    id: int
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True




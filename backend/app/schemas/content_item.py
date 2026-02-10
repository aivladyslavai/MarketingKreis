from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.models.content_item import ContentAssetKind, ContentItemStatus


class UserOut(BaseModel):
    id: int
    email: str
    role: str

    class Config:
        from_attributes = True


class ContentItemBase(BaseModel):
    title: str = Field(..., max_length=255)
    channel: str = Field("Website", max_length=100)
    format: Optional[str] = Field(None, max_length=100)
    status: ContentItemStatus = Field(ContentItemStatus.DRAFT)
    tags: Optional[List[str]] = None
    brief: Optional[str] = None
    body: Optional[str] = None
    tone: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field("de", max_length=10)
    due_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    company_id: Optional[int] = None
    project_id: Optional[int] = None
    activity_id: Optional[int] = None
    blocked_reason: Optional[str] = Field(None, max_length=255)
    blocked_by: Optional[List[str]] = None


class ContentItemCreate(ContentItemBase):
    owner_id: Optional[int] = None


class ContentItemUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    channel: Optional[str] = Field(None, max_length=100)
    format: Optional[str] = Field(None, max_length=100)
    status: Optional[ContentItemStatus] = None
    tags: Optional[List[str]] = None
    brief: Optional[str] = None
    body: Optional[str] = None
    tone: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=10)
    due_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    company_id: Optional[int] = None
    project_id: Optional[int] = None
    activity_id: Optional[int] = None
    owner_id: Optional[int] = None
    blocked_reason: Optional[str] = Field(None, max_length=255)
    blocked_by: Optional[List[str]] = None
    create_version: Optional[bool] = False


class ContentItemOut(ContentItemBase):
    id: int
    owner_id: Optional[int] = None
    owner: Optional[UserOut] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContentItemReviewerCreate(BaseModel):
    reviewer_id: int
    role: Optional[str] = Field(None, max_length=50)


class ContentItemReviewerOut(BaseModel):
    id: int
    reviewer_id: Optional[int] = None
    role: Optional[str] = None
    reviewer: Optional[UserOut] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContentReviewDecisionOut(BaseModel):
    id: int
    item_id: int
    reviewer_id: int
    decision: str
    note: Optional[str] = None
    reviewer: Optional[UserOut] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContentItemCommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=10000)


class ContentItemCommentOut(BaseModel):
    id: int
    item_id: int
    author_id: Optional[int] = None
    author: Optional[UserOut] = None
    body: str
    created_at: datetime

    class Config:
        from_attributes = True


class ContentChecklistItemCreate(BaseModel):
    title: str = Field(..., max_length=255)
    position: Optional[int] = 0


class ContentChecklistItemUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    is_done: Optional[bool] = None
    position: Optional[int] = None


class ContentChecklistItemOut(BaseModel):
    id: int
    item_id: int
    title: str
    is_done: bool
    position: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContentAssetCreate(BaseModel):
    kind: ContentAssetKind = ContentAssetKind.LINK
    name: Optional[str] = Field(None, max_length=255)
    url: Optional[str] = Field(None, max_length=2048)
    upload_id: Optional[int] = None
    source: Optional[str] = Field(None, max_length=50)


class ContentAssetUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    url: Optional[str] = Field(None, max_length=2048)
    source: Optional[str] = Field(None, max_length=50)
    version: Optional[int] = None


class ContentAssetOut(BaseModel):
    id: int
    item_id: int
    kind: ContentAssetKind
    name: Optional[str] = None
    url: Optional[str] = None
    upload_id: Optional[int] = None
    source: Optional[str] = None
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None
    version: int
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContentVersionCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    brief: Optional[str] = None
    body: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


class ContentVersionOut(BaseModel):
    id: int
    item_id: int
    version: int
    title: Optional[str] = None
    brief: Optional[str] = None
    body: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContentAuditOut(BaseModel):
    id: int
    item_id: int
    actor_id: Optional[int] = None
    action: str
    data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContentTemplateCreate(BaseModel):
    name: str = Field(..., max_length=120)
    description: Optional[str] = Field(None, max_length=1024)
    channel: Optional[str] = Field(None, max_length=100)
    format: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    checklist: Optional[List[str]] = None
    tasks: Optional[List[Dict[str, Any]]] = None
    reviewers: Optional[List[int]] = None


class ContentTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=120)
    description: Optional[str] = Field(None, max_length=1024)
    channel: Optional[str] = Field(None, max_length=100)
    format: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    checklist: Optional[List[str]] = None
    tasks: Optional[List[Dict[str, Any]]] = None
    reviewers: Optional[List[int]] = None


class ContentTemplateOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    channel: Optional[str] = None
    format: Optional[str] = None
    tags: Optional[List[str]] = None
    checklist: Optional[List[str]] = None
    tasks: Optional[List[Dict[str, Any]]] = None
    reviewers: Optional[List[int]] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContentAutomationRuleCreate(BaseModel):
    name: str = Field(..., max_length=120)
    is_active: bool = True
    trigger: str = Field(..., max_length=60)
    template_id: Optional[int] = None
    config: Optional[Dict[str, Any]] = None


class ContentAutomationRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=120)
    is_active: Optional[bool] = None
    trigger: Optional[str] = Field(None, max_length=60)
    template_id: Optional[int] = None
    config: Optional[Dict[str, Any]] = None


class ContentAutomationRuleOut(BaseModel):
    id: int
    name: str
    is_active: bool
    trigger: str
    template_id: Optional[int] = None
    config: Optional[Dict[str, Any]] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    body: Optional[str] = None
    url: Optional[str] = None
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


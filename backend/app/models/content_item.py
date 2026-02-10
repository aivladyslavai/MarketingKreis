import enum

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class ContentItemStatus(str, enum.Enum):
    IDEA = "IDEA"
    DRAFT = "DRAFT"
    REVIEW = "REVIEW"
    APPROVED = "APPROVED"
    SCHEDULED = "SCHEDULED"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"
    BLOCKED = "BLOCKED"


class ContentReviewDecision(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ContentAssetKind(str, enum.Enum):
    LINK = "LINK"
    UPLOAD = "UPLOAD"


class ContentItem(Base):
    __tablename__ = "content_items"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    channel = Column(String(100), nullable=False, default="Website")
    format = Column(String(100), nullable=True)
    status = Column(Enum(ContentItemStatus), nullable=False, default=ContentItemStatus.DRAFT)

    # Free-form tags, stored as JSON list[str]
    tags = Column(JSON, nullable=True)

    # Long-form content + metadata (optional)
    brief = Column(Text, nullable=True)
    body = Column(Text, nullable=True)
    tone = Column(String(50), nullable=True)  # e.g. formal, friendly, direct
    language = Column(String(10), nullable=True, default="de")

    # Editorial planning
    due_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Link to CRM / activities
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("deals.id", ondelete="SET NULL"), nullable=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="SET NULL"), nullable=True, index=True)

    # Ownership & permissions
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Workflow helpers
    blocked_reason = Column(String(255), nullable=True)
    blocked_by = Column(JSON, nullable=True)  # list[str] / ids (frontend-managed)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    company = relationship("Company", foreign_keys=[company_id])
    project = relationship("Deal", foreign_keys=[project_id])
    activity = relationship("Activity", foreign_keys=[activity_id])

    comments = relationship("ContentItemComment", back_populates="item", cascade="all, delete-orphan")
    checklist_items = relationship("ContentItemChecklistItem", back_populates="item", cascade="all, delete-orphan")
    assets = relationship("ContentItemAsset", back_populates="item", cascade="all, delete-orphan")
    versions = relationship("ContentItemVersion", back_populates="item", cascade="all, delete-orphan")
    audit_logs = relationship("ContentItemAuditLog", back_populates="item", cascade="all, delete-orphan")
    reviewers = relationship("ContentItemReviewer", back_populates="item", cascade="all, delete-orphan")
    review_decisions = relationship("ContentItemReviewDecision", back_populates="item", cascade="all, delete-orphan")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<ContentItem id={self.id} title={self.title!r} status={self.status}>"


class ContentItemReviewer(Base):
    __tablename__ = "content_item_reviewers"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    role = Column(String(50), nullable=True)  # reviewer|approver|viewer (optional)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    item = relationship("ContentItem", back_populates="reviewers")
    reviewer = relationship("User", foreign_keys=[reviewer_id])


class ContentItemReviewDecision(Base):
    __tablename__ = "content_item_review_decisions"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    decision = Column(String(20), nullable=False)  # APPROVED|REJECTED
    note = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    item = relationship("ContentItem", back_populates="review_decisions")
    reviewer = relationship("User", foreign_keys=[reviewer_id])


class ContentItemComment(Base):
    __tablename__ = "content_item_comments"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    body = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    item = relationship("ContentItem", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])


class ContentItemChecklistItem(Base):
    __tablename__ = "content_item_checklist"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    is_done = Column(Boolean, nullable=False, server_default="0")
    position = Column(Integer, nullable=False, server_default="0")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    item = relationship("ContentItem", back_populates="checklist_items")


class ContentItemAsset(Base):
    __tablename__ = "content_item_assets"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(Enum(ContentAssetKind), nullable=False, default=ContentAssetKind.LINK)
    name = Column(String(255), nullable=True)

    # LINK assets: url; UPLOAD assets: upload_id
    url = Column(String(2048), nullable=True)
    upload_id = Column(Integer, ForeignKey("uploads.id", ondelete="SET NULL"), nullable=True, index=True)

    # Optional metadata
    source = Column(String(50), nullable=True)  # figma|docs|drive|upload|other
    mime_type = Column(String(100), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    version = Column(Integer, nullable=False, server_default="1")

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    item = relationship("ContentItem", back_populates="assets")
    created_by_user = relationship("User", foreign_keys=[created_by])
    upload = relationship("Upload", foreign_keys=[upload_id])


class ContentItemVersion(Base):
    __tablename__ = "content_item_versions"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    title = Column(String(255), nullable=True)
    brief = Column(Text, nullable=True)
    body = Column(Text, nullable=True)
    meta = Column(JSON, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    item = relationship("ContentItem", back_populates="versions")
    created_by_user = relationship("User", foreign_keys=[created_by])


class ContentItemAuditLog(Base):
    __tablename__ = "content_item_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    data = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    item = relationship("ContentItem", back_populates="audit_logs")
    actor = relationship("User", foreign_keys=[actor_id])


class ContentTemplate(Base):
    __tablename__ = "content_templates"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(120), nullable=False)
    description = Column(String(1024), nullable=True)
    channel = Column(String(100), nullable=True)
    format = Column(String(100), nullable=True)
    tags = Column(JSON, nullable=True)  # list[str]

    # Stored as JSON for flexibility (frontend can evolve without schema changes)
    checklist = Column(JSON, nullable=True)  # list[str]
    tasks = Column(JSON, nullable=True)  # list[{title,status,priority,offset_days,recurrence?}]
    reviewers = Column(JSON, nullable=True)  # list[int] user ids

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    created_by_user = relationship("User", foreign_keys=[created_by])


class ContentAutomationRule(Base):
    __tablename__ = "content_automation_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    is_active = Column(Boolean, nullable=False, server_default="1")
    trigger = Column(String(60), nullable=False)  # e.g. deal_won
    template_id = Column(Integer, ForeignKey("content_templates.id", ondelete="SET NULL"), nullable=True, index=True)
    config = Column(JSON, nullable=True)  # arbitrary conditions/settings
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    template = relationship("ContentTemplate", foreign_keys=[template_id])
    created_by_user = relationship("User", foreign_keys=[created_by])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(String(60), nullable=False, default="info")
    title = Column(String(255), nullable=False)
    body = Column(String(2000), nullable=True)
    url = Column(String(2048), nullable=True)
    dedupe_key = Column(String(255), nullable=True, unique=True)

    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", foreign_keys=[user_id])


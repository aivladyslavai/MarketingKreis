from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class ContentTaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    REVIEW = "REVIEW"
    APPROVED = "APPROVED"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ContentTaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class ContentTask(Base):
    __tablename__ = "content_tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    channel = Column(String(100), nullable=False, default="Website")
    format = Column(String(100), nullable=True)
    status = Column(Enum(ContentTaskStatus), nullable=False, default=ContentTaskStatus.TODO)
    priority = Column(Enum(ContentTaskPriority), nullable=False, default=ContentTaskPriority.MEDIUM)
    notes = Column(String(2000), nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    activity_id = Column(Integer, nullable=True)

    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    owner = relationship("User")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<ContentTask id={self.id} title={self.title!r} status={self.status}>"




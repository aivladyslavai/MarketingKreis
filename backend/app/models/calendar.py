from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class CalendarEntry(Base):
    __tablename__ = "calendar_entries"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="SET NULL"), nullable=True)
    # Core event fields
    title = Column(String(255), nullable=False)
    description = Column(String(2048), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    event_type = Column(String(50), nullable=True)
    status = Column(String(50), nullable=True)  # e.g. PLANNED, ACTIVE, DONE, CANCELLED
    color = Column(String(32), nullable=True)
    # User-defined category (e.g. Marketing circle ring / label)
    category = Column(String(255), nullable=True)
    # Optional metadata
    location = Column(String(255), nullable=True)
    attendees = Column(JSON, nullable=True)  # list[str]
    priority = Column(String(20), nullable=True)  # low|medium|high|urgent (frontend)
    # Simple recurrence structure:
    # { freq: daily|weekly|monthly, interval?: int, count?: int, until?: YYYY-MM-DD }
    recurrence = Column(JSON, nullable=True)
    # Dates to skip for a series (YYYY-MM-DD)
    recurrence_exceptions = Column(JSON, nullable=True)  # list[str]

    # Links into CRM / user domain
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("deals.id", ondelete="SET NULL"), nullable=True, index=True)
    # Optional link into Content Hub (editorial calendar sync)
    content_item_id = Column(Integer, ForeignKey("content_items.id", ondelete="SET NULL"), nullable=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    activity = relationship("Activity", back_populates="calendar_entries")
    # Optional convenience relationships to CRM / user entities (no backrefs required)
    company = relationship("Company", foreign_keys=[company_id])
    project = relationship("Deal", foreign_keys=[project_id])
    content_item = relationship("ContentItem", foreign_keys=[content_item_id])
    owner = relationship("User", foreign_keys=[owner_id])



from __future__ import annotations

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(160), nullable=False)
    description = Column(String(1024), nullable=True)

    # Stored config:
    # - datePreset / from / to
    # - compare
    # - sections visibility
    # - language/tone/brand
    config = Column(JSON, nullable=True)

    is_default = Column(Boolean, nullable=False, server_default="0")

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    created_by_user = relationship("User", foreign_keys=[created_by])


class ReportRun(Base):
    __tablename__ = "report_runs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    template_id = Column(Integer, ForeignKey("report_templates.id", ondelete="SET NULL"), nullable=True, index=True)

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Parameters used for generation
    params = Column(JSON, nullable=True)
    # Snapshot of key numbers for transparency/history
    kpi_snapshot = Column(JSON, nullable=True)
    # Optional rendered HTML (can be used to reopen exact output)
    html = Column(Text, nullable=True)

    status = Column(String(32), nullable=False, server_default="ok")  # ok|error
    error = Column(String(2000), nullable=True)

    template = relationship("ReportTemplate", foreign_keys=[template_id])
    created_by_user = relationship("User", foreign_keys=[created_by])


class ReportSchedule(Base):
    __tablename__ = "report_schedules"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    template_id = Column(Integer, ForeignKey("report_templates.id", ondelete="SET NULL"), nullable=True, index=True)

    name = Column(String(160), nullable=False)
    is_active = Column(Boolean, nullable=False, server_default="1")

    # Weekly schedule (simple & robust)
    # weekday: 0=Mon .. 6=Sun
    weekday = Column(Integer, nullable=False, server_default="0")
    hour = Column(Integer, nullable=False, server_default="8")
    minute = Column(Integer, nullable=False, server_default="0")
    timezone = Column(String(64), nullable=False, server_default="Europe/Zurich")

    # Recipients stored as JSON list[str]
    recipients = Column(JSON, nullable=True)

    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True, index=True)

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    template = relationship("ReportTemplate", foreign_keys=[template_id])
    created_by_user = relationship("User", foreign_keys=[created_by])


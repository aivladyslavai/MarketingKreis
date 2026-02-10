from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ReportTemplateBase(BaseModel):
    name: str = Field(..., max_length=160)
    description: Optional[str] = Field(None, max_length=1024)
    config: Optional[Dict[str, Any]] = None
    is_default: bool = False


class ReportTemplateCreate(ReportTemplateBase):
    pass


class ReportTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=160)
    description: Optional[str] = Field(None, max_length=1024)
    config: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None


class ReportTemplateOut(ReportTemplateBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportRunCreate(BaseModel):
    template_id: Optional[int] = None
    params: Optional[Dict[str, Any]] = None
    kpi_snapshot: Optional[Dict[str, Any]] = None
    html: Optional[str] = None
    status: str = "ok"
    error: Optional[str] = None


class ReportRunOut(BaseModel):
    id: int
    template_id: Optional[int] = None
    created_by: Optional[int] = None
    created_at: datetime
    params: Optional[Dict[str, Any]] = None
    kpi_snapshot: Optional[Dict[str, Any]] = None
    status: str
    error: Optional[str] = None

    class Config:
        from_attributes = True


class ReportRunOutWithHtml(ReportRunOut):
    html: Optional[str] = None


class ReportScheduleBase(BaseModel):
    name: str = Field(..., max_length=160)
    template_id: Optional[int] = None
    is_active: bool = True
    weekday: int = Field(0, ge=0, le=6)
    hour: int = Field(8, ge=0, le=23)
    minute: int = Field(0, ge=0, le=59)
    timezone: str = Field("Europe/Zurich", max_length=64)
    recipients: List[str] = Field(default_factory=list)


class ReportScheduleCreate(ReportScheduleBase):
    pass


class ReportScheduleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=160)
    template_id: Optional[int] = None
    is_active: Optional[bool] = None
    weekday: Optional[int] = Field(None, ge=0, le=6)
    hour: Optional[int] = Field(None, ge=0, le=23)
    minute: Optional[int] = Field(None, ge=0, le=59)
    timezone: Optional[str] = Field(None, max_length=64)
    recipients: Optional[List[str]] = None


class ReportScheduleOut(ReportScheduleBase):
    id: int
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


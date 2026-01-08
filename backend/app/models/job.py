from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    rq_id = Column(String(64), unique=True, index=True, nullable=False)
    type = Column(String(50), nullable=False)  # import_activities, import_performance, export_pdf, export_csv, etc
    status = Column(String(20), nullable=False, default="queued")  # queued, started, finished, failed
    result = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)




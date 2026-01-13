from sqlalchemy import Column, Integer, String, DateTime, Numeric, LargeBinary, Boolean
from sqlalchemy.sql import func

from app.db.base import Base


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    original_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Numeric(14, 0), nullable=True)
    # If enabled, store bytes directly in Postgres (survives restarts/deploys).
    content = Column(LargeBinary, nullable=True)
    sha256 = Column(String(64), nullable=True, index=True)
    stored_in_db = Column(Boolean, nullable=False, server_default="1")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)



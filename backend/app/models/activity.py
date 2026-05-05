from sqlalchemy import Column, Integer, String, Enum, Date, Numeric, Float, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class ActivityType(str, enum.Enum):
    branding = "Branding"
    sales = "Sales"
    employer_branding = "Employer Branding"
    kundenpflege = "Kundenpflege"


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    type = Column(Enum(ActivityType), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    # Import provenance: when created from an Upload, we store its id here.
    source_upload_id = Column(Integer, nullable=True, index=True)
    # Optional human-readable category name (e.g. user-defined ring like "Product")
    category_name = Column(String(255), nullable=True)
    category_id = Column(Integer, ForeignKey("user_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True)
    project_id = Column(Integer, ForeignKey("deals.id", ondelete="SET NULL"), nullable=True, index=True)
    budget = Column(Numeric(12, 2), nullable=True)
    expected_output = Column(String(1024), nullable=True)
    weight = Column(Float, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Optional owner of the activity. If NULL, the activity is global/demo.
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    owner = relationship("User", back_populates="activities")
    category = relationship("UserCategory", foreign_keys=[category_id])
    company = relationship("Company", foreign_keys=[company_id])
    project = relationship("Deal", foreign_keys=[project_id])

    calendar_entries = relationship("CalendarEntry", back_populates="activity", cascade="all, delete-orphan")



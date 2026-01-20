from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    industry = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    status = Column(String(20), nullable=True, default="active")
    revenue = Column(Numeric(14, 2), nullable=True)
    employees = Column(Integer, nullable=True)
    notes = Column(String(1024), nullable=True)

    # Extra optional CRM fields (all nullable for safe migrations)
    contact_person_name = Column(String(255), nullable=True)
    contact_person_position = Column(String(100), nullable=True)
    contact_person_email = Column(String(255), nullable=True)
    contact_person_phone = Column(String(50), nullable=True)

    vat_id = Column(String(64), nullable=True)
    lead_source = Column(String(100), nullable=True)
    priority = Column(String(20), nullable=True)
    next_follow_up_at = Column(DateTime(timezone=True), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    tags = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    contacts = relationship("Contact", back_populates="company", cascade="all,delete-orphan")
    deals = relationship("Deal", back_populates="company")




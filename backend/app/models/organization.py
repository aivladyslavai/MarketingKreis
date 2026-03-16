from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(255), nullable=True)
    team_size = Column(String(100), nullable=True)
    country = Column(String(120), nullable=True)
    language = Column(String(20), nullable=True)
    owner_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    onboarding_completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # There are two FK paths between organizations ↔ users:
    # - users.organization_id -> organizations.id
    # - organizations.owner_user_id -> users.id
    # Explicitly choose the FK used for the "members of the org" relationship.
    users = relationship("User", back_populates="organization", foreign_keys="User.organization_id")


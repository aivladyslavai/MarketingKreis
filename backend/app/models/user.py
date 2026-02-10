from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class UserRole(str, enum.Enum):
    user = "user"
    editor = "editor"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.user)
    is_verified = Column(Boolean, nullable=False, server_default="0")
    # Multi-tenant workspace (organization) ownership. Enforced by API layer.
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # 2FA (TOTP) for admins (and optionally others)
    totp_enabled = Column(Boolean, nullable=False, server_default="0")
    totp_secret_enc = Column(Text, nullable=True)
    totp_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    totp_last_used_step = Column(Integer, nullable=True)
    # Array of {hash: str, used_at: optional iso} items (no plaintext in DB)
    totp_recovery_codes = Column(JSON, nullable=True)

    # RBAC-lite: per-section permissions overrides.
    # Example: {"crm": true, "reports": false}
    section_permissions = Column(JSON, nullable=True)

    # RBAC-lite: per-section access toggles (e.g. {"crm": true, "admin": false})
    section_permissions = Column(JSON, nullable=True)

    # Activities owned by this user
    activities = relationship("Activity", back_populates="owner")

    organization = relationship("Organization", back_populates="users")

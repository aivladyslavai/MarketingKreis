from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class AuthSession(Base):
    """
    Server-side session tracked via refresh-token rotation.

    Access JWT includes `sid` (session id). On each request we can validate the
    session is not revoked.
    """

    __tablename__ = "auth_sessions"

    # UUID string
    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    user_agent = Column(Text, nullable=True)
    ip = Column(String(64), nullable=True)

    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(String(255), nullable=True)

    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User")
    refresh_tokens = relationship("AuthRefreshToken", back_populates="session", cascade="all, delete-orphan")


class AuthRefreshToken(Base):
    """
    Individual refresh tokens (JWT) identified by `jti`.

    Rotation model:
    - On refresh, the used token is revoked and a new token is issued.
    - Reuse of a revoked token indicates compromise -> revoke whole session.
    """

    __tablename__ = "auth_refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(36), ForeignKey("auth_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    token_jti = Column(String(64), unique=True, index=True, nullable=False)

    issued_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    revoked_at = Column(DateTime(timezone=True), nullable=True)
    replaced_by_jti = Column(String(64), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("AuthSession", back_populates="refresh_tokens")


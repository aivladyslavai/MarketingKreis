from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from jose import jwt
from typing import Callable
from datetime import datetime, timezone, timedelta

from app.core.config import get_settings
from app.db.session import get_db_session  # re-exported for convenience
from app.models.user import User, UserRole
from app.models.auth_session import AuthSession


def get_current_user(
    request: Request,
    db: Session = Depends(get_db_session),
) -> User:
    """Extract current user from access token cookie. Raises 401 if invalid."""
    settings = get_settings()
    token = request.cookies.get(settings.cookie_access_name)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("typ") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(payload.get("sub"))
        sid = payload.get("sid")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Session revocation check (refresh-token based sessions)
    try:
        if not sid:
            raise HTTPException(status_code=401, detail="Invalid token")
        session = db.get(AuthSession, str(sid))
        if not session or session.revoked_at is not None:
            raise HTTPException(status_code=401, detail="Session revoked")
        # Update last_seen_at (best-effort) for "Sessions" screen.
        # Avoid writing on every request: only bump if older than 5 minutes.
        try:
            now = datetime.now(timezone.utc)
            if session.last_seen_at is None or (now - session.last_seen_at) > timedelta(minutes=5):
                session.last_seen_at = now
                db.add(session)
                db.commit()
        except Exception:
            # Never block request on telemetry write.
            pass
    except HTTPException:
        raise
    except Exception:
        # Fail closed: if anything goes wrong, require re-auth.
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*allowed_roles: UserRole) -> Callable:
    """Create dependency that requires user to have one of the specified roles."""
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker


def require_admin_step_up() -> Callable:
    """
    Require a recent 2FA step-up for sensitive admin operations.

    - If user is not admin -> 403 (shouldn't be used).
    - If admin has no TOTP enabled -> allow (backward compatible).
    - If admin has TOTP enabled -> require session.mfa_verified_at within configured window.
    """

    def checker(request: Request, db: Session = Depends(get_db_session), user: User = Depends(require_role(UserRole.admin))) -> User:
        # If 2FA is not enabled, do not block legacy admins.
        if not bool(getattr(user, "totp_enabled", False)):
            return user

        settings = get_settings()
        token = request.cookies.get(settings.cookie_access_name)
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
            if payload.get("typ") != "access":
                raise HTTPException(status_code=401, detail="Invalid token")
            sid = str(payload.get("sid") or "")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")

        if not sid:
            raise HTTPException(status_code=401, detail="Invalid token")

        sess = db.get(AuthSession, sid)
        if not sess or sess.revoked_at is not None:
            raise HTTPException(status_code=401, detail="Session revoked")

        verified_at = getattr(sess, "mfa_verified_at", None)
        if not verified_at:
            raise HTTPException(status_code=428, detail="2FA step-up required")

        try:
            max_age = int(getattr(settings, "admin_step_up_max_age_minutes", 12 * 60))
        except Exception:
            max_age = 12 * 60

        now = datetime.now(timezone.utc)
        # Ensure timezone-aware comparison
        try:
            if verified_at.tzinfo is None:
                verified_at = verified_at.replace(tzinfo=timezone.utc)
        except Exception:
            pass

        if max_age > 0 and (now - verified_at) > timedelta(minutes=max_age):
            raise HTTPException(status_code=428, detail="2FA step-up required")

        return user

    return checker


def is_demo_user(user: User) -> bool:
    """Return True if the user is configured as demo read-only."""
    settings = get_settings()
    raw = (getattr(settings, "demo_readonly_emails", "") or "").strip()
    if not raw:
        return False
    emails = {e.strip().lower() for e in raw.split(",") if e and e.strip()}
    return (user.email or "").strip().lower() in emails


def get_org_id(user: User) -> int:
    """
    Multi-tenant helper.

    Backward-compatible default for older datasets: org=1 (migration/bootstrap backfills to 1).
    """
    try:
        return int(getattr(user, "organization_id", None) or 1)
    except Exception:
        return 1


def require_writable_user(user: User = Depends(get_current_user)) -> User:
    """
    Enforce a strict read-only mode for demo accounts on mutating endpoints.
    """
    if is_demo_user(user):
        raise HTTPException(status_code=403, detail="Demo account is read-only")
    return user



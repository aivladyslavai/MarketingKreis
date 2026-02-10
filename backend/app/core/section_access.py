from __future__ import annotations

from typing import Optional

from jose import jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from fastapi import Request

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.auth_session import AuthSession


def _section_from_path(path: str) -> Optional[str]:
    p = (path or "").lower()
    if p.startswith("/admin"):
        return "admin"
    if p.startswith("/crm"):
        return "crm"
    if p.startswith("/calendar"):
        return "calendar"
    if p.startswith("/activities"):
        return "activities"
    if p.startswith("/performance"):
        return "performance"
    if p.startswith("/budget"):
        return "budget"
    if p.startswith("/content"):
        return "content"
    if p.startswith("/reports"):
        return "reports"
    if p.startswith("/uploads"):
        return "uploads"
    return None


class SectionAccessMiddleware(BaseHTTPMiddleware):
    """
    RBAC-lite enforcement at the backend edge.

    - If user has `section_permissions` dict and the current section is set to False -> 403
    - Admin role always allowed (except when session is revoked / invalid).
    - If permissions are missing -> allow (backward compatible).
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path or ""
        # Always allow auth + health + metrics + docs
        if path.startswith("/auth") or path.startswith("/health") or path.startswith("/metrics") or path.startswith("/openapi") or path.startswith("/docs"):
            return await call_next(request)
        if request.method in ("OPTIONS",):
            return await call_next(request)

        section = _section_from_path(path)
        if not section:
            return await call_next(request)

        settings = get_settings()
        token = request.cookies.get(settings.cookie_access_name)
        if not token:
            # not authenticated => let downstream return 401 where needed
            return await call_next(request)

        db = SessionLocal()
        try:
            try:
                payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
                if payload.get("typ") != "access":
                    return Response("Forbidden", status_code=403)
                user_id = int(payload.get("sub") or 0)
                sid = str(payload.get("sid") or "")
            except Exception:
                return Response("Forbidden", status_code=403)

            # session must exist + not revoked
            try:
                if not sid:
                    return Response("Forbidden", status_code=403)
                sess = db.get(AuthSession, sid)
                if not sess or sess.revoked_at is not None:
                    return Response("Forbidden", status_code=403)
            except Exception:
                return Response("Forbidden", status_code=403)

            user = db.get(User, user_id)
            if not user:
                return Response("Forbidden", status_code=403)

            if section == "admin":
                if user.role != UserRole.admin:
                    return Response("Forbidden", status_code=403)
                return await call_next(request)

            if user.role == UserRole.admin:
                return await call_next(request)

            perms = getattr(user, "section_permissions", None)
            if isinstance(perms, dict):
                v = perms.get(section)
                if v is False:
                    return Response("Forbidden", status_code=403)

            return await call_next(request)
        finally:
            try:
                db.close()
            except Exception:
                pass


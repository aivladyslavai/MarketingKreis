from __future__ import annotations

from typing import Optional

from jose import jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.user import User, UserRole


def _section_for_path(path: str) -> Optional[str]:
    p = path or "/"
    # public/system endpoints
    if p in {"/", "/health", "/healthz", "/readyz", "/metrics"}:
        return None
    if p.startswith("/auth"):
        return None

    # main product sections
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


class SectionRBACMiddleware(BaseHTTPMiddleware):
    """
    RBAC-lite enforcement by section using a JSON override on users:
      users.section_permissions = { "crm": true, "reports": false, ... }

    Backward-compatible behavior:
    - If section_permissions is null or does not mention a section -> allow.
    - Only explicit false denies access.
    - /admin is always admin-only.
    """

    async def dispatch(self, request, call_next):
        section = _section_for_path(request.url.path)
        if not section:
            return await call_next(request)

        settings = get_settings()
        token = request.cookies.get(settings.cookie_access_name)
        if not token:
            # Let route-level auth handle unauthenticated access.
            return await call_next(request)

        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
            if payload.get("typ") != "access":
                return await call_next(request)
            user_id = int(payload.get("sub") or 0)
        except Exception:
            return await call_next(request)

        db = SessionLocal()
        try:
            user = db.get(User, user_id)
            if not user:
                return await call_next(request)

            role = user.role
            if section == "admin":
                if role != UserRole.admin:
                    return Response("Forbidden", status_code=403)
                return await call_next(request)

            # Admin bypass
            if role == UserRole.admin:
                return await call_next(request)

            perms = getattr(user, "section_permissions", None) or {}
            if isinstance(perms, dict) and perms.get(section) is False:
                return Response("Forbidden", status_code=403)

            return await call_next(request)
        finally:
            try:
                db.close()
            except Exception:
                pass


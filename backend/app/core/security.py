from typing import Iterable, Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.core.config import get_settings
import re
import logging


class CSRFMiddleware(BaseHTTPMiddleware):
    """CSRF protection for cookie-authenticated requests.

    Defense-in-depth:
    - For unsafe methods (POST/PUT/PATCH/DELETE), if auth cookies are present,
      require a double-submit CSRF token: header `X-CSRF-Token` must equal a
      non-HttpOnly CSRF cookie.
    - Additionally (optional) validate Origin/Referer when present.
    - Skips GET/HEAD/OPTIONS.
    """

    def __init__(self, app, allowed_origins: Iterable[str], allowed_origin_regex: Optional[str] = None):
        super().__init__(app)
        self.allowed = set(allowed_origins)
        self._regex = re.compile(allowed_origin_regex) if allowed_origin_regex else None

    async def dispatch(self, request: Request, call_next):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)

        settings = get_settings()

        # Double-submit CSRF: only enforce when cookie-auth is in play.
        # This covers browser->Next proxy->backend flows where Origin/Referer
        # may be missing on the backend request.
        has_auth_cookie = bool(
            request.cookies.get(settings.cookie_access_name) or request.cookies.get(settings.cookie_refresh_name)
        )
        if has_auth_cookie:
            csrf_cookie = (request.cookies.get(settings.cookie_csrf_name) or "").strip()
            csrf_header = (request.headers.get("x-csrf-token") or "").strip()
            if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
                try:
                    logging.getLogger("mk.http").warning(
                        "csrf_blocked token_mismatch method=%s path=%s has_auth=%s cookie_present=%s header_present=%s",
                        request.method,
                        request.url.path,
                        True,
                        bool(csrf_cookie),
                        bool(csrf_header),
                    )
                except Exception:
                    pass
                return Response("Forbidden (CSRF token)", status_code=403)

        origin = request.headers.get("origin") or ""
        referer = request.headers.get("referer") or ""

        if origin:
            if self._regex and self._regex.match(origin):
                # explicitly allowed by regex
                pass
            elif not any(origin.startswith(a) for a in self.allowed):
                try:
                    logging.getLogger("mk.http").warning(
                        "csrf_blocked origin method=%s path=%s origin=%s",
                        request.method,
                        request.url.path,
                        origin,
                    )
                except Exception:
                    pass
                return Response("Forbidden (CSRF origin)", status_code=403)

        if referer:
            if self._regex and self._regex.match(referer):
                # explicitly allowed by regex
                pass
            elif not any(referer.startswith(a) for a in self.allowed):
                try:
                    logging.getLogger("mk.http").warning(
                        "csrf_blocked referer method=%s path=%s referer=%s",
                        request.method,
                        request.url.path,
                        referer,
                    )
                except Exception:
                    pass
                return Response("Forbidden (CSRF referer)", status_code=403)

        return await call_next(request)




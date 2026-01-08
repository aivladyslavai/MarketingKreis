from typing import Iterable, Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.core.config import get_settings
import re


class CSRFMiddleware(BaseHTTPMiddleware):
    """Very lightweight CSRF check for state-changing requests in production.

    - Allows only requests with Origin/Referer matching allowed CORS origins
    - Skips GET/HEAD/OPTIONS
    """

    def __init__(self, app, allowed_origins: Iterable[str], allowed_origin_regex: Optional[str] = None):
        super().__init__(app)
        self.allowed = set(allowed_origins)
        self._regex = re.compile(allowed_origin_regex) if allowed_origin_regex else None

    async def dispatch(self, request: Request, call_next):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)

        origin = request.headers.get("origin") or ""
        referer = request.headers.get("referer") or ""

        if origin:
            if self._regex and self._regex.match(origin):
                # explicitly allowed by regex
                pass
            elif not any(origin.startswith(a) for a in self.allowed):
                return Response("Forbidden (CSRF origin)", status_code=403)

        if referer:
            if self._regex and self._regex.match(referer):
                # explicitly allowed by regex
                pass
            elif not any(referer.startswith(a) for a in self.allowed):
                return Response("Forbidden (CSRF referer)", status_code=403)

        return await call_next(request)




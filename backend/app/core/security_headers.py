from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Centralized browser hardening headers.

    Applies to all responses. For API responses CSP is mostly informational, but keeping it
    consistent helps prevent accidental HTML rendering and enables clickjacking protection.
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Baseline
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")

        # Frame ancestors via CSP (preferred), plus object-src hardening.
        csp = "; ".join(
            [
                "default-src 'none'",
                "base-uri 'none'",
                "object-src 'none'",
                "frame-ancestors 'none'",
                "form-action 'none'",
            ]
        )
        response.headers.setdefault("Content-Security-Policy", csp)

        # HSTS only over HTTPS (Render terminates TLS; rely on x-forwarded-proto)
        proto = (request.headers.get("x-forwarded-proto") or request.url.scheme or "").lower()
        if proto == "https":
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

        return response


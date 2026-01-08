import logging
import time
import uuid
from typing import Optional

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Lightweight middleware that adds a request ID and logs basic request/response
    information. This gives us a minimal level of observability in production.
    """

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start = time.time()
        try:
            response = await call_next(request)
            duration_ms = int((time.time() - start) * 1000)
            logging.getLogger("mk.http").info(
                "%s %s %s %sms",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception:
            logging.getLogger("mk.http").exception(
                "Unhandled exception for %s %s [request_id=%s]",
                request.method,
                request.url.path,
                request_id,
            )
            raise


def configure_logging() -> None:
    """Configure a sane default logging setup for the backend."""
    root = logging.getLogger()
    if not root.handlers:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        )


def init_tracing(app: FastAPI) -> None:
    """
    Attach basic request logging and, if configured, error tracing (Sentry).
    This is safe to call multiple times.
    """
    settings = get_settings()
    configure_logging()

    # Add HTTP request logging
    app.add_middleware(RequestLoggingMiddleware)

    # Optional Sentry integration for error tracking
    dsn: Optional[str] = getattr(settings, "sentry_dsn", None)
    if not dsn:
        return

    try:
        import sentry_sdk  # type: ignore[import-not-found]
        from sentry_sdk.integrations.fastapi import FastApiIntegration  # type: ignore[import-not-found]

        sentry_sdk.init(
            dsn=dsn,
            environment=getattr(settings, "sentry_env", settings.environment),
            integrations=[FastApiIntegration()],
            traces_sample_rate=float(
                # Can be overridden in env; keep low by default
                getattr(__import__("os").environ, "get", lambda *_: "0.05")("SENTRY_TRACES_SAMPLE_RATE", "0.05")
            ),
        )
        logging.getLogger("mk.tracing").info("Sentry tracing initialized")
    except ImportError:
        logging.getLogger("mk.tracing").warning(
            "sentry-sdk not installed; skipping Sentry tracing setup"
        )





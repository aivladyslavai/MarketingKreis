import json
import logging
import os
import time
import uuid
from typing import Optional

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.core.alerts import record_5xx_and_maybe_alert

try:
    from prometheus_client import Counter, Histogram  # type: ignore
except Exception:  # pragma: no cover
    Counter = None  # type: ignore
    Histogram = None  # type: ignore


_REQ_COUNT = (
    Counter(
        "mk_http_requests_total",
        "Total HTTP requests",
        ["method", "route", "status"],
    )
    if Counter
    else None
)
_REQ_LATENCY = (
    Histogram(
        "mk_http_request_duration_seconds",
        "HTTP request duration (seconds)",
        ["method", "route"],
        buckets=(0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10),
    )
    if Histogram
    else None
)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Lightweight middleware that adds a request ID and logs basic request/response
    information. This gives us a minimal level of observability in production.
    """

    async def dispatch(self, request: Request, call_next):
        # Propagate a request id if provided by upstream (e.g. CDN / proxy), else generate.
        request_id = (
            request.headers.get("x-request-id")
            or request.headers.get("x-requestid")
            or str(uuid.uuid4())
        )
        start = time.time()
        try:
            response = await call_next(request)
            duration_ms = int((time.time() - start) * 1000)
            route_obj = request.scope.get("route")
            route = getattr(route_obj, "path", None) or request.url.path

            payload = {
                "event": "http_request",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "route": route,
                "status_code": response.status_code,
                "status_class": int(response.status_code // 100),
                "duration_ms": duration_ms,
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
                "release": os.getenv("RENDER_GIT_COMMIT") or os.getenv("GIT_SHA"),
            }

            # Log level by status family (focus on 4xx/5xx for аварийность)
            logger = logging.getLogger("mk.http")
            if response.status_code >= 500:
                logger.error(json.dumps(payload, ensure_ascii=False))
                record_5xx_and_maybe_alert(payload)
            elif response.status_code >= 400:
                logger.warning(json.dumps(payload, ensure_ascii=False))
            else:
                logger.info(json.dumps(payload, ensure_ascii=False))

            # Prometheus metrics (skip self-scrape + health)
            if route not in ("/metrics", "/health", "/healthz", "/readyz"):
                if _REQ_COUNT is not None:
                    _REQ_COUNT.labels(request.method, route, str(response.status_code)).inc()
                if _REQ_LATENCY is not None:
                    _REQ_LATENCY.labels(request.method, route).observe((time.time() - start))

            response.headers["X-Request-ID"] = request_id
            return response
        except Exception:
            duration_ms = int((time.time() - start) * 1000)
            route_obj = request.scope.get("route")
            route = getattr(route_obj, "path", None) or request.url.path
            payload = {
                "event": "http_exception",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "route": route,
                "status_code": 500,
                "status_class": 5,
                "duration_ms": duration_ms,
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
                "release": os.getenv("RENDER_GIT_COMMIT") or os.getenv("GIT_SHA"),
            }
            logging.getLogger("mk.http").exception(json.dumps(payload, ensure_ascii=False))
            # Also trigger ops alerting for unhandled exceptions
            record_5xx_and_maybe_alert(payload)
            raise


def configure_logging() -> None:
    """Configure a sane default logging setup for the backend."""
    root = logging.getLogger()
    if not root.handlers:
        logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
    # Ensure our loggers are visible even if uvicorn already configured logging
    logging.getLogger("mk.http").setLevel(logging.INFO)
    logging.getLogger("mk.tracing").setLevel(logging.INFO)


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
            environment=(getattr(settings, "sentry_env", None) or settings.environment),
            release=os.getenv("RENDER_GIT_COMMIT") or os.getenv("GIT_SHA") or None,
            integrations=[FastApiIntegration()],
            # Can be overridden in env; keep low by default
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.05")),
        )
        logging.getLogger("mk.tracing").info("Sentry tracing initialized")
    except ImportError:
        logging.getLogger("mk.tracing").warning(
            "sentry-sdk not installed; skipping Sentry tracing setup"
        )





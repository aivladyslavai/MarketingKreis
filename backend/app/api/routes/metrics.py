import os

from fastapi import APIRouter, HTTPException, Request, Response

from app.core.config import get_settings

try:
    # Optional dependency; required when metrics are enabled
    from prometheus_client import CONTENT_TYPE_LATEST, generate_latest  # type: ignore
except Exception:  # pragma: no cover
    CONTENT_TYPE_LATEST = "text/plain; version=0.0.4; charset=utf-8"
    generate_latest = None  # type: ignore


router = APIRouter(tags=["metrics"])


@router.get("/metrics")
def metrics(request: Request) -> Response:
    """
    Prometheus metrics endpoint.

    - In production, it is disabled by default and requires METRICS_TOKEN to be set
      and sent as: Authorization: Bearer <token>
    """
    settings = get_settings()
    token = getattr(settings, "metrics_token", None) or os.getenv("METRICS_TOKEN")

    if settings.environment == "production":
        # Do not expose metrics publicly unless explicitly enabled
        if not token:
            raise HTTPException(status_code=404, detail="Not found")
        auth = request.headers.get("authorization") or ""
        if auth != f"Bearer {token}":
            raise HTTPException(status_code=403, detail="Forbidden")

    if generate_latest is None:
        raise HTTPException(status_code=503, detail="Metrics not available")

    payload = generate_latest()
    return Response(content=payload, media_type=CONTENT_TYPE_LATEST)


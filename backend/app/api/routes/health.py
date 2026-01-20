import os
from datetime import datetime, timezone

from fastapi import APIRouter, Response
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import engine

router = APIRouter(tags=["health"])

def _release() -> str | None:
    # Render provides commit SHA in RENDER_GIT_COMMIT for connected repos
    return os.getenv("RENDER_GIT_COMMIT") or os.getenv("GIT_SHA") or None


@router.get("/")
def root() -> dict:
    # Render default health check may hit "/" (GET/HEAD). Keep it cheap and 200.
    settings = get_settings()
    return {
        "status": "ok",
        "service": "marketingkreis-backend",
        "environment": settings.environment,
        "release": _release(),
        "time": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health")
@router.get("/healthz")
def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "service": "marketingkreis-backend",
        "environment": settings.environment,
        "release": _release(),
        "time": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/readyz")
def readyz(response: Response) -> dict:
    """
    Readiness check: verifies DB connectivity and that Alembic version table exists.
    Returns 503 when not ready.
    """
    settings = get_settings()
    checks: dict[str, object] = {}
    ok = True

    # 1) Database connectivity
    try:
        with engine.connect() as conn:
            conn.execute(text("select 1"))
        checks["db"] = "ok"
    except Exception as e:
        ok = False
        checks["db"] = "error"
        checks["db_error"] = str(e)[:250]

    # 2) Alembic version present (prod hardening)
    try:
        with engine.connect() as conn:
            v = conn.execute(text("select version_num from alembic_version limit 1")).scalar()
        checks["alembic_version"] = v or None
        if settings.environment == "production" and not v:
            ok = False
    except Exception as e:
        checks["alembic_version"] = None
        checks["alembic_error"] = str(e)[:250]
        if settings.environment == "production":
            ok = False

    if not ok:
        response.status_code = 503
    return {
        "status": "ok" if ok else "not_ready",
        "service": "marketingkreis-backend",
        "environment": settings.environment,
        "release": _release(),
        "checks": checks,
        "time": datetime.now(timezone.utc).isoformat(),
    }


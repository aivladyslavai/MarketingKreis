import logging
import os
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.core.config import get_settings
from app.db.session import engine

logger = logging.getLogger("mk.migrations")


def _alembic_config() -> Config:
    """
    Create an Alembic config pointing at backend/alembic.ini.
    We set sqlalchemy.url explicitly (env.py also overrides it) to be robust.
    """
    settings = get_settings()
    backend_dir = Path(__file__).resolve().parents[2]  # .../backend
    cfg = Config(str(backend_dir / "alembic.ini"))
    cfg.set_main_option("sqlalchemy.url", settings.database_url)
    return cfg


def stamp_head_if_missing() -> bool:
    """
    If alembic_version table is missing, stamp DB to current head.
    Returns True if a stamp was performed.
    """
    insp = inspect(engine)
    if insp.has_table("alembic_version"):
        return False

    logger.warning("alembic_version missing; stamping database to Alembic head (no schema changes).")
    cfg = _alembic_config()
    command.stamp(cfg, "head")
    return True


def upgrade_head() -> None:
    """Run alembic upgrade head."""
    logger.info("Running Alembic upgrade head.")
    cfg = _alembic_config()
    command.upgrade(cfg, "head")


def run_migrations_on_startup() -> None:
    """
    Controlled by env vars:
    - ALEMBIC_STAMP_IF_MISSING=true: create alembic_version if missing (safe/no-op)
    - ALEMBIC_UPGRADE_ON_STARTUP=true: run upgrade head (applies migrations)
    """
    settings = get_settings()
    if settings.environment != "production":
        return

    stamp = os.getenv("ALEMBIC_STAMP_IF_MISSING", "").lower() in {"1", "true", "yes", "on"}
    upgrade = os.getenv("ALEMBIC_UPGRADE_ON_STARTUP", "").lower() in {"1", "true", "yes", "on"}

    if not stamp and not upgrade:
        return

    try:
        if stamp:
            did = stamp_head_if_missing()
            if did:
                logger.warning("Database stamped to Alembic head successfully.")
        if upgrade:
            upgrade_head()
    except Exception:
        logger.exception("Migration startup step failed.")
        raise


import logging
import os
from pathlib import Path
import threading
from typing import Callable, Optional

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.core.config import get_settings
from app.db.session import engine

logger = logging.getLogger("mk.migrations")
_migration_thread: Optional[threading.Thread] = None


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

def _bool_env(name: str, default: bool = False) -> bool:
    v = os.getenv(name)
    if v is None:
        return default
    return v.strip().lower() in {"1", "true", "yes", "on"}


def _start_background(job_name: str, fn: Callable[[], None]) -> None:
    """
    Start a background thread for migrations so the web server can bind the port quickly.
    This avoids Render (free tier) startup timeouts.
    """
    global _migration_thread
    if _migration_thread and _migration_thread.is_alive():
        logger.warning("Migration already running in background; skipping (%s).", job_name)
        return

    def _runner():
        try:
            fn()
            logger.warning("Migration background job finished (%s).", job_name)
        except Exception:
            logger.exception("Migration background job failed (%s).", job_name)

    t = threading.Thread(target=_runner, name=f"mk-{job_name}", daemon=True)
    _migration_thread = t
    t.start()


def run_migrations_on_startup() -> None:
    """
    Controlled by env vars:
    - ALEMBIC_STAMP_IF_MISSING=true: create alembic_version if missing (safe/no-op)
    - ALEMBIC_UPGRADE_ON_STARTUP=true: run upgrade head (applies migrations)
    """
    settings = get_settings()
    if settings.environment != "production":
        return

    stamp = _bool_env("ALEMBIC_STAMP_IF_MISSING", default=False)
    upgrade = _bool_env("ALEMBIC_UPGRADE_ON_STARTUP", default=False)
    async_mode = _bool_env("ALEMBIC_ASYNC_ON_STARTUP", default=True)

    if not stamp and not upgrade:
        return

    try:
        # IMPORTANT:
        # - If upgrade is requested, do NOT stamp first. `alembic upgrade head` will create
        #   the version table (if missing) and apply migrations. Stamping first would mark
        #   the DB as "up-to-date" and skip migrations.
        if upgrade:
            if async_mode:
                logger.warning("Starting Alembic upgrade head in background thread.")
                _start_background("alembic-upgrade", upgrade_head)
                return
            upgrade_head()
            return

        if stamp:
            if async_mode:
                logger.warning("Starting Alembic stamp in background thread.")
                _start_background("alembic-stamp", lambda: stamp_head_if_missing())
                return
            did = stamp_head_if_missing()
            if did:
                logger.warning("Database stamped to Alembic head successfully.")
    except Exception:
        logger.exception("Migration startup step failed.")
        raise


import logging
import os
from pathlib import Path
import threading
from typing import Callable, Optional

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect, text

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

def bootstrap_production_schema() -> None:
    """
    Emergency / free-tier friendly schema bootstrap.

    Alembic can be slow/unreliable on some platforms during deploy startup.
    This function applies the minimal DDL needed for production safety in an
    idempotent way, and ensures alembic_version is set to our current head.
    """
    target_revision = "20260115_0004"

    # Use a single transaction; Postgres supports transactional DDL.
    with engine.begin() as conn:
        # Ensure version table exists (create if missing)
        conn.execute(
            text(
                "create table if not exists alembic_version ("
                "version_num varchar(32) not null"
                ")"
            )
        )

        # Emails: normalize + case-insensitive uniqueness
        conn.execute(text("update users set email = lower(email) where email is not null;"))
        conn.execute(
            text(
                "do $$\n"
                "begin\n"
                "  if not exists (\n"
                "    select 1 from pg_indexes where schemaname='public' and indexname='ux_users_email_lower'\n"
                "  ) then\n"
                "    create unique index ux_users_email_lower on users (lower(email));\n"
                "  end if;\n"
                "end $$;"
            )
        )

        # Uploads: store bytes + checksum
        conn.execute(text("alter table uploads add column if not exists content bytea;"))
        conn.execute(text("alter table uploads add column if not exists sha256 varchar(64);"))
        conn.execute(text("alter table uploads add column if not exists stored_in_db boolean not null default true;"))
        conn.execute(text("create index if not exists ix_uploads_sha256 on uploads (sha256);"))

        # Companies: extra optional CRM fields (all nullable)
        conn.execute(text("alter table companies add column if not exists contact_person_name varchar(255);"))
        conn.execute(text("alter table companies add column if not exists contact_person_position varchar(100);"))
        conn.execute(text("alter table companies add column if not exists contact_person_email varchar(255);"))
        conn.execute(text("alter table companies add column if not exists contact_person_phone varchar(50);"))
        conn.execute(text("alter table companies add column if not exists vat_id varchar(64);"))
        conn.execute(text("alter table companies add column if not exists lead_source varchar(100);"))
        conn.execute(text("alter table companies add column if not exists priority varchar(20);"))
        conn.execute(text("alter table companies add column if not exists next_follow_up_at timestamptz;"))
        conn.execute(text("alter table companies add column if not exists linkedin_url varchar(255);"))
        conn.execute(text("alter table companies add column if not exists tags varchar(255);"))

        # Calendar entries: store category + recurrence in DB (cross-browser)
        conn.execute(text("alter table calendar_entries add column if not exists category varchar(255);"))
        conn.execute(text("alter table calendar_entries add column if not exists location varchar(255);"))
        conn.execute(text("alter table calendar_entries add column if not exists priority varchar(20);"))
        conn.execute(text("alter table calendar_entries add column if not exists attendees jsonb;"))
        conn.execute(text("alter table calendar_entries add column if not exists recurrence jsonb;"))
        conn.execute(text("alter table calendar_entries add column if not exists recurrence_exceptions jsonb;"))

        # Ensure version table has exactly one row with target head.
        conn.execute(text("delete from alembic_version;"))
        conn.execute(text("insert into alembic_version (version_num) values (:v);"), {"v": target_revision})

    logger.warning("Bootstrap schema applied; alembic_version set to %s.", target_revision)


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
    bootstrap = _bool_env("DB_BOOTSTRAP_ON_STARTUP", default=False)

    if not stamp and not upgrade and not bootstrap:
        return

    try:
        if bootstrap:
            logger.warning("Starting DB bootstrap schema in background thread.")
            _start_background("db-bootstrap", bootstrap_production_schema)
            return

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


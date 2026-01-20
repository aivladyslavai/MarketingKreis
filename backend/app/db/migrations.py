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
    target_revision = "20260120_0007"

    # Use a single transaction; Postgres supports transactional DDL.
    with engine.begin() as conn:
        # --- Organizations (multi-tenant) ---
        conn.execute(
            text(
                "create table if not exists organizations ("
                "id serial primary key, "
                "name varchar(255) not null, "
                "created_at timestamptz not null default now(), "
                "updated_at timestamptz not null default now()"
                ")"
            )
        )
        # Ensure a default organization exists to backfill older data.
        # We keep it stable at id=1 when possible.
        conn.execute(
            text(
                "insert into organizations (id, name) values (1, 'Default') "
                "on conflict (id) do nothing"
            )
        )

        # Users: add organization_id and backfill
        conn.execute(text("alter table users add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_users_organization_id on users (organization_id);"))
        conn.execute(text("update users set organization_id = 1 where organization_id is null;"))

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
        conn.execute(text("alter table uploads add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_uploads_organization_id on uploads (organization_id);"))
        conn.execute(text("update uploads set organization_id = 1 where organization_id is null;"))

        # Jobs (imports/exports): keep tenant-local
        conn.execute(text("alter table jobs add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_jobs_organization_id on jobs (organization_id);"))
        conn.execute(text("update jobs set organization_id = 1 where organization_id is null;"))

        # Performance metrics table (if present): keep tenant-local
        conn.execute(text("alter table performance_metrics add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_performance_metrics_organization_id on performance_metrics (organization_id);"))
        conn.execute(text("update performance_metrics set organization_id = 1 where organization_id is null;"))

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
        conn.execute(text("alter table companies add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_companies_organization_id on companies (organization_id);"))
        conn.execute(text("update companies set organization_id = 1 where organization_id is null;"))

        # Contacts
        conn.execute(text("alter table contacts add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_contacts_organization_id on contacts (organization_id);"))
        conn.execute(text("update contacts set organization_id = 1 where organization_id is null;"))

        # Deals / projects
        conn.execute(text("alter table deals add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_deals_organization_id on deals (organization_id);"))
        conn.execute(text("update deals set organization_id = 1 where organization_id is null;"))

        # Calendar entries: store category + recurrence in DB (cross-browser)
        conn.execute(text("alter table calendar_entries add column if not exists category varchar(255);"))
        conn.execute(text("alter table calendar_entries add column if not exists location varchar(255);"))
        conn.execute(text("alter table calendar_entries add column if not exists priority varchar(20);"))
        conn.execute(text("alter table calendar_entries add column if not exists attendees jsonb;"))
        conn.execute(text("alter table calendar_entries add column if not exists recurrence jsonb;"))
        conn.execute(text("alter table calendar_entries add column if not exists recurrence_exceptions jsonb;"))
        conn.execute(text("alter table calendar_entries add column if not exists content_item_id integer;"))
        conn.execute(text("create index if not exists ix_calendar_entries_content_item_id on calendar_entries (content_item_id);"))
        conn.execute(text("alter table calendar_entries add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_calendar_entries_organization_id on calendar_entries (organization_id);"))
        conn.execute(text("update calendar_entries set organization_id = 1 where organization_id is null;"))

        # Activities
        conn.execute(text("alter table activities add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_activities_organization_id on activities (organization_id);"))
        conn.execute(text("update activities set organization_id = 1 where organization_id is null;"))

        # User categories (rings)
        conn.execute(text("alter table user_categories add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_user_categories_organization_id on user_categories (organization_id);"))
        conn.execute(text("update user_categories set organization_id = 1 where organization_id is null;"))

        # Budget targets
        conn.execute(text("alter table budget_targets add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_budget_targets_organization_id on budget_targets (organization_id);"))
        conn.execute(text("update budget_targets set organization_id = 1 where organization_id is null;"))
        conn.execute(text("alter table kpi_targets add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_kpi_targets_organization_id on kpi_targets (organization_id);"))
        conn.execute(text("update kpi_targets set organization_id = 1 where organization_id is null;"))

        # Content tasks: link to content items + recurrence
        conn.execute(text("alter table content_tasks add column if not exists content_item_id integer;"))
        conn.execute(text("alter table content_tasks add column if not exists recurrence jsonb;"))
        conn.execute(text("create index if not exists ix_content_tasks_content_item_id on content_tasks (content_item_id);"))
        conn.execute(text("alter table content_tasks add column if not exists organization_id integer;"))
        conn.execute(text("create index if not exists ix_content_tasks_organization_id on content_tasks (organization_id);"))
        conn.execute(text("update content_tasks set organization_id = 1 where organization_id is null;"))

        # Content Hub: enum types (idempotent)
        conn.execute(
            text(
                "do $$\n"
                "begin\n"
                "  if not exists (select 1 from pg_type where typname = 'contentitemstatus') then\n"
                "    create type contentitemstatus as enum ('IDEA','DRAFT','REVIEW','APPROVED','SCHEDULED','PUBLISHED','ARCHIVED','BLOCKED');\n"
                "  end if;\n"
                "end $$;"
            )
        )
        conn.execute(
            text(
                "do $$\n"
                "begin\n"
                "  if not exists (select 1 from pg_type where typname = 'contentassetkind') then\n"
                "    create type contentassetkind as enum ('LINK','UPLOAD');\n"
                "  end if;\n"
                "end $$;"
            )
        )

        # Content Items (campaigns/materials)
        conn.execute(
            text(
                "create table if not exists content_items (\n"
                "  id serial primary key,\n"
                "  title varchar(255) not null,\n"
                "  channel varchar(100) not null default 'Website',\n"
                "  format varchar(100),\n"
                "  status contentitemstatus not null default 'DRAFT',\n"
                "  tags jsonb,\n"
                "  brief text,\n"
                "  body text,\n"
                "  tone varchar(50),\n"
                "  language varchar(10) default 'de',\n"
                "  due_at timestamptz,\n"
                "  scheduled_at timestamptz,\n"
                "  published_at timestamptz,\n"
                "  company_id integer,\n"
                "  project_id integer,\n"
                "  activity_id integer,\n"
                "  owner_id integer,\n"
                "  organization_id integer,\n"
                "  blocked_reason varchar(255),\n"
                "  blocked_by jsonb,\n"
                "  created_at timestamptz not null default now(),\n"
                "  updated_at timestamptz not null default now()\n"
                ");"
            )
        )
        conn.execute(text("create index if not exists ix_content_items_owner_id on content_items (owner_id);"))
        conn.execute(text("create index if not exists ix_content_items_company_id on content_items (company_id);"))
        conn.execute(text("create index if not exists ix_content_items_project_id on content_items (project_id);"))
        conn.execute(text("create index if not exists ix_content_items_activity_id on content_items (activity_id);"))
        conn.execute(text("create index if not exists ix_content_items_organization_id on content_items (organization_id);"))
        conn.execute(text("update content_items set organization_id = 1 where organization_id is null;"))

        # Reviewer assignments
        conn.execute(
            text(
                "create table if not exists content_item_reviewers (\n"
                "  id serial primary key,\n"
                "  item_id integer not null,\n"
                "  reviewer_id integer,\n"
                "  role varchar(50),\n"
                "  created_at timestamptz not null default now()\n"
                ");"
            )
        )
        conn.execute(text("create index if not exists ix_content_item_reviewers_item_id on content_item_reviewers (item_id);"))
        conn.execute(text("create index if not exists ix_content_item_reviewers_reviewer_id on content_item_reviewers (reviewer_id);"))

        # Comments
        conn.execute(
            text(
                "create table if not exists content_item_comments (\n"
                "  id serial primary key,\n"
                "  item_id integer not null,\n"
                "  author_id integer,\n"
                "  body text not null,\n"
                "  created_at timestamptz not null default now()\n"
                ");"
            )
        )
        conn.execute(text("create index if not exists ix_content_item_comments_item_id on content_item_comments (item_id);"))
        conn.execute(text("create index if not exists ix_content_item_comments_author_id on content_item_comments (author_id);"))

        # Checklist
        conn.execute(
            text(
                "create table if not exists content_item_checklist (\n"
                "  id serial primary key,\n"
                "  item_id integer not null,\n"
                "  title varchar(255) not null,\n"
                "  is_done boolean not null default false,\n"
                "  position integer not null default 0,\n"
                "  created_at timestamptz not null default now(),\n"
                "  updated_at timestamptz not null default now()\n"
                ");"
            )
        )
        conn.execute(text("create index if not exists ix_content_item_checklist_item_id on content_item_checklist (item_id);"))

        # Assets (links/uploads)
        conn.execute(
            text(
                "create table if not exists content_item_assets (\n"
                "  id serial primary key,\n"
                "  item_id integer not null,\n"
                "  kind contentassetkind not null default 'LINK',\n"
                "  name varchar(255),\n"
                "  url varchar(2048),\n"
                "  upload_id integer,\n"
                "  source varchar(50),\n"
                "  mime_type varchar(100),\n"
                "  size_bytes integer,\n"
                "  version integer not null default 1,\n"
                "  created_by integer,\n"
                "  created_at timestamptz not null default now()\n"
                ");"
            )
        )
        conn.execute(text("create index if not exists ix_content_item_assets_item_id on content_item_assets (item_id);"))
        conn.execute(text("create index if not exists ix_content_item_assets_upload_id on content_item_assets (upload_id);"))

        # Versions
        conn.execute(
            text(
                "create table if not exists content_item_versions (\n"
                "  id serial primary key,\n"
                "  item_id integer not null,\n"
                "  version integer not null,\n"
                "  title varchar(255),\n"
                "  brief text,\n"
                "  body text,\n"
                "  meta jsonb,\n"
                "  created_by integer,\n"
                "  created_at timestamptz not null default now()\n"
                ");"
            )
        )
        conn.execute(text("create index if not exists ix_content_item_versions_item_id on content_item_versions (item_id);"))

        # Audit log
        conn.execute(
            text(
                "create table if not exists content_item_audit_log (\n"
                "  id serial primary key,\n"
                "  item_id integer not null,\n"
                "  actor_id integer,\n"
                "  action varchar(100) not null,\n"
                "  data jsonb,\n"
                "  created_at timestamptz not null default now()\n"
                ");"
            )
        )
        conn.execute(text("create index if not exists ix_content_item_audit_log_item_id on content_item_audit_log (item_id);"))
        conn.execute(text("create index if not exists ix_content_item_audit_log_actor_id on content_item_audit_log (actor_id);"))

        # Templates + automation rules
        conn.execute(
            text(
                "create table if not exists content_templates (\n"
                "  id serial primary key,\n"
                "  name varchar(120) not null,\n"
                "  description varchar(1024),\n"
                "  channel varchar(100),\n"
                "  format varchar(100),\n"
                "  tags jsonb,\n"
                "  checklist jsonb,\n"
                "  tasks jsonb,\n"
                "  reviewers jsonb,\n"
                "  organization_id integer,\n"
                "  created_by integer,\n"
                "  created_at timestamptz not null default now(),\n"
                "  updated_at timestamptz not null default now()\n"
                ");"
            )
        )
        conn.execute(text("create index if not exists ix_content_templates_created_by on content_templates (created_by);"))
        conn.execute(text("create index if not exists ix_content_templates_organization_id on content_templates (organization_id);"))
        conn.execute(text("update content_templates set organization_id = 1 where organization_id is null;"))

        conn.execute(
            text(
                "create table if not exists content_automation_rules (\n"
                "  id serial primary key,\n"
                "  name varchar(120) not null,\n"
                "  is_active boolean not null default true,\n"
                "  trigger varchar(60) not null,\n"
                "  template_id integer,\n"
                "  config jsonb,\n"
                "  organization_id integer,\n"
                "  created_by integer,\n"
                "  created_at timestamptz not null default now(),\n"
                "  updated_at timestamptz not null default now()\n"
                ");"
            )
        )
        conn.execute(text("create index if not exists ix_content_automation_rules_template_id on content_automation_rules (template_id);"))
        conn.execute(text("create index if not exists ix_content_automation_rules_created_by on content_automation_rules (created_by);"))
        conn.execute(text("create index if not exists ix_content_automation_rules_organization_id on content_automation_rules (organization_id);"))
        conn.execute(text("update content_automation_rules set organization_id = 1 where organization_id is null;"))

        # Notifications
        conn.execute(
            text(
                "create table if not exists notifications (\n"
                "  id serial primary key,\n"
                "  user_id integer not null,\n"
                "  type varchar(60) not null default 'info',\n"
                "  title varchar(255) not null,\n"
                "  body varchar(2000),\n"
                "  url varchar(2048),\n"
                "  dedupe_key varchar(255) unique,\n"
                "  organization_id integer,\n"
                "  read_at timestamptz,\n"
                "  created_at timestamptz not null default now()\n"
                ");"
            )
        )
        conn.execute(text("create index if not exists ix_notifications_user_id on notifications (user_id);"))
        conn.execute(text("create index if not exists ix_notifications_organization_id on notifications (organization_id);"))
        conn.execute(text("update notifications set organization_id = 1 where organization_id is null;"))

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


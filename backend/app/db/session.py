import threading

from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings


settings = get_settings()

db_url = settings.database_url
try:
    is_sqlite = make_url(db_url).get_backend_name() == "sqlite"
except Exception:
    # Fallback: handle values like "sqlite+pysqlite:///:memory:"
    is_sqlite = db_url.startswith("sqlite")

# Create engine — tune params for SQLite vs. others
if is_sqlite:
    # SQLite: limited concurrency; avoid unsupported pool args
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
        echo=False,
    )
else:
    # Postgres/MySQL: enable pooling
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=20,
        max_overflow=10,
        pool_recycle=3600,
        echo=False,
    )

# --- Production schema self-heal (Render safety) ---
_schema_lock = threading.Lock()
_schema_checked = False


def _ensure_production_schema() -> None:
    """
    Ensure critical columns exist before ORM queries run.

    This avoids production outages when deployment happens without running Alembic/bootstraps
    (e.g. DB_BOOTSTRAP_ON_STARTUP not set) but code expects new columns.
    """
    global _schema_checked
    if _schema_checked:
        return
    if settings.environment not in {"production", "staging"}:
        _schema_checked = True
        return
    if is_sqlite:
        _schema_checked = True
        return

    with _schema_lock:
        if _schema_checked:
            return

        # Quick check: critical columns exist?
        # We must ensure both multi-tenant scoping AND import-provenance columns exist,
        # otherwise newer code (smart import / delete cascade) will fail at runtime.
        try:
            with engine.connect() as conn:
                has_org = conn.execute(
                    text(
                        "select 1 from information_schema.columns "
                        "where table_name='users' and column_name='organization_id' limit 1"
                    )
                ).first()
                has_src = conn.execute(
                    text(
                        "select 1 from information_schema.columns "
                        "where table_name='activities' and column_name='source_upload_id' limit 1"
                    )
                ).first()
                has_job_phase = conn.execute(
                    text(
                        "select 1 from information_schema.columns "
                        "where table_name='jobs' and column_name='phase' limit 1"
                    )
                ).first()
                if has_org and has_src and has_job_phase:
                    _schema_checked = True
                    return
        except Exception:
            # If check fails, still attempt best-effort DDL.
            pass

        try:
            with engine.begin() as conn:
                try:
                    conn.execute(text("alter type userrole add value if not exists 'owner';"))
                except Exception:
                    pass
                # organizations + default org
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
                conn.execute(
                    text(
                        "insert into organizations (id, name) values (1, 'Default') "
                        "on conflict (id) do nothing"
                    )
                )

                # Minimal required for auth + multi-tenant scoping
                conn.execute(text("alter table users add column if not exists organization_id integer;"))
                conn.execute(text("update users set organization_id = 1 where organization_id is null;"))
                conn.execute(text("alter table users add column if not exists position_title varchar(255);"))
                conn.execute(text("alter table users add column if not exists onboarding_completed_at timestamptz;"))
                conn.execute(text("alter table users add column if not exists invited_by_user_id integer;"))
                conn.execute(text("alter table organizations add column if not exists industry varchar(255);"))
                conn.execute(text("alter table organizations add column if not exists team_size varchar(100);"))
                conn.execute(text("alter table organizations add column if not exists country varchar(120);"))
                conn.execute(text("alter table organizations add column if not exists language varchar(20);"))
                conn.execute(text("alter table organizations add column if not exists owner_user_id integer;"))
                conn.execute(text("alter table organizations add column if not exists onboarding_completed_at timestamptz;"))

                # Other tables used by org-scoped queries (best-effort, safe if table exists)
                for t in [
                    "uploads",
                    "companies",
                    "contacts",
                    "deals",
                    "activities",
                    "calendar_entries",
                    "user_categories",
                    "budget_targets",
                    "kpi_targets",
                    "content_items",
                    "content_tasks",
                    "content_templates",
                    "content_automation_rules",
                    "notifications",
                    "jobs",
                    "performance_metrics",
                ]:
                    conn.execute(text(f"alter table if exists {t} add column if not exists organization_id integer;"))

                # Import provenance (best-effort). Keep in sync with ORM models.
                for t in [
                    "activities",
                    "calendar_entries",
                    "companies",
                    "contacts",
                    "deals",
                    "user_categories",
                    "budget_targets",
                    "kpi_targets",
                    "content_items",
                    "content_tasks",
                ]:
                    conn.execute(text(f"alter table if exists {t} add column if not exists source_upload_id integer;"))

                conn.execute(text("alter table if exists deals add column if not exists owner_id integer;"))

                # Upload ownership (new hardening)
                conn.execute(text("alter table if exists uploads add column if not exists owner_id integer;"))
                # Job progress/cancel/retry
                conn.execute(text("alter table if exists jobs add column if not exists phase varchar(50);"))
                conn.execute(text("alter table if exists jobs add column if not exists progress integer;"))
                conn.execute(text("alter table if exists jobs add column if not exists upload_id integer;"))
                conn.execute(text("alter table if exists jobs add column if not exists cancelled_at timestamptz;"))
                try:
                    has_stage = conn.execute(
                        text(
                            "select 1 from information_schema.columns "
                            "where table_name='jobs' and column_name='stage' limit 1"
                        )
                    ).first()
                    if has_stage:
                        conn.execute(text("update jobs set phase = stage where phase is null and stage is not null;"))
                except Exception:
                    pass
                # Upload audit log (who imported/deleted)
                conn.execute(
                    text(
                        "create table if not exists upload_audit_log ("
                        "id serial primary key, "
                        "organization_id integer, "
                        "upload_id integer, "
                        "actor_id integer, "
                        "action varchar(50) not null, "
                        "details text, "
                        "created_at timestamptz not null default now()"
                        ")"
                    )
                )
                conn.execute(
                    text(
                        "create table if not exists organization_invites ("
                        "id serial primary key, "
                        "organization_id integer not null, "
                        "email varchar(255) not null, "
                        "role varchar(50) not null, "
                        "section_permissions jsonb null, "
                        "token_hash varchar(128) not null unique, "
                        "expires_at timestamptz not null, "
                        "created_by_user_id integer null, "
                        "accepted_at timestamptz null, "
                        "accepted_by_user_id integer null, "
                        "revoked_at timestamptz null, "
                        "last_sent_at timestamptz null, "
                        "notes text null, "
                        "created_at timestamptz not null default now(), "
                        "updated_at timestamptz not null default now()"
                        ")"
                    )
                )
                # Admin 2FA step-up tracking on sessions
                conn.execute(text("alter table auth_sessions add column if not exists mfa_verified_at timestamptz;"))
                # Indexes are intentionally not created here to keep this path fast.
                # Proper indexes should be applied via Alembic or DB_BOOTSTRAP_ON_STARTUP.
        except Exception:
            # Do not prevent the service from starting; next deploy should run migrations properly.
            pass

        # Mark as checked only if the critical columns are now present.
        try:
            with engine.connect() as conn:
                has_org = conn.execute(
                    text(
                        "select 1 from information_schema.columns "
                        "where table_name='users' and column_name='organization_id' limit 1"
                    )
                ).first()
                has_src = conn.execute(
                    text(
                        "select 1 from information_schema.columns "
                        "where table_name='activities' and column_name='source_upload_id' limit 1"
                    )
                ).first()
                has_job_phase = conn.execute(
                    text(
                        "select 1 from information_schema.columns "
                        "where table_name='jobs' and column_name='phase' limit 1"
                    )
                ).first()
                _schema_checked = bool(has_org and has_src and has_job_phase)
        except Exception:
            _schema_checked = False
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db_session():
    _ensure_production_schema()
    db = SessionLocal()
    try:
        yield db
    except Exception:
        # Ensure failed requests don't leave transactions open
        try:
            db.rollback()
        except Exception:
            pass
        raise
    finally:
        db.close()



"""org_multitenant

Revision ID: 20260120_0006
Revises: 20260119_0005
Create Date: 2026-01-20

- Introduce organizations (tenants/workspaces)
- Add organization_id to core domain tables and backfill existing rows
"""

from alembic import op
import sqlalchemy as sa


# Alembic's default version table uses VARCHAR(32), so keep revision <= 32 chars.
revision = "20260120_0006"
down_revision = "20260119_0005"
branch_labels = None
depends_on = None



def _has_table(bind, table: str) -> bool:
    insp = sa.inspect(bind)
    return insp.has_table(table)


def _has_column(bind, table: str, column: str) -> bool:
    insp = sa.inspect(bind)
    cols = [c["name"] for c in insp.get_columns(table)]
    return column in cols


def _has_fk(bind, table: str, name: str) -> bool:
    insp = sa.inspect(bind)
    try:
        fks = insp.get_foreign_keys(table) or []
    except Exception:
        return False
    return any((fk.get("name") == name) for fk in fks)


def _dialect(bind) -> str:
    try:
        return (bind.dialect.name or "").lower()
    except Exception:
        return ""


def _ensure_default_org(bind) -> int:
    """
    Create a default organization and return its id.

    We use a stable id=1 when possible to keep backfills deterministic.
    """
    d = _dialect(bind)
    if d == "postgresql":
        op.execute(
            sa.text(
                "insert into organizations (id, name, created_at, updated_at)\n"
                "values (1, 'Default', now(), now())\n"
                "on conflict (id) do nothing"
            )
        )
        return 1
    if d == "sqlite":
        op.execute(sa.text("insert or ignore into organizations (id, name) values (1, 'Default')"))
        return 1
    # best-effort generic
    try:
        op.execute(sa.text("insert into organizations (id, name) values (1, 'Default')"))
        return 1
    except Exception:
        pass
    # fallback: insert without id
    op.execute(sa.text("insert into organizations (name) values ('Default')"))
    # best effort: read back
    try:
        rid = bind.execute(sa.text("select id from organizations order by id asc limit 1")).scalar()
        return int(rid or 1)
    except Exception:
        return 1


def upgrade() -> None:
    bind = op.get_bind()

    # --- organizations table ---
    if not _has_table(bind, "organizations"):
        op.create_table(
            "organizations",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        )
        op.create_index("ix_organizations_id", "organizations", ["id"])

    default_org_id = _ensure_default_org(bind)

    # Helper: add org_id column + fk + index + backfill
    def add_org(table: str, nullable: bool = True) -> None:
        if not _has_table(bind, table):
            return
        if not _has_column(bind, table, "organization_id"):
            op.add_column(table, sa.Column("organization_id", sa.Integer(), nullable=nullable))
        # FK best-effort (safe to skip on sqlite)
        fk_name = f"fk_{table}_organization_id"
        if _dialect(bind) == "postgresql":
            if not _has_fk(bind, table, fk_name):
                try:
                    op.create_foreign_key(
                        fk_name,
                        table,
                        "organizations",
                        ["organization_id"],
                        ["id"],
                        ondelete="SET NULL",
                    )
                except Exception:
                    # best-effort: do not fail migration on FK creation
                    pass
        # Index for scoping queries
        try:
            op.create_index(f"ix_{table}_organization_id", table, ["organization_id"])
        except Exception:
            pass
        # Backfill
        try:
            op.execute(
                sa.text(f"update {table} set organization_id = :oid where organization_id is null").bindparams(
                    oid=default_org_id
                )
            )
        except Exception:
            pass

    # Core tables
    add_org("users", nullable=True)
    add_org("companies", nullable=True)
    add_org("contacts", nullable=True)
    add_org("deals", nullable=True)
    add_org("activities", nullable=True)
    add_org("calendar_entries", nullable=True)
    add_org("uploads", nullable=True)
    add_org("user_categories", nullable=True)
    add_org("budget_targets", nullable=True)
    add_org("kpi_targets", nullable=True)

    # Content Hub tables (created in 20260119_0005)
    add_org("content_items", nullable=True)
    add_org("content_tasks", nullable=True)
    add_org("content_templates", nullable=True)
    add_org("content_automation_rules", nullable=True)
    add_org("notifications", nullable=True)


def downgrade() -> None:
    # Best-effort downgrade (not recommended in prod)
    bind = op.get_bind()

    def drop_org(table: str) -> None:
        if not _has_table(bind, table):
            return
        if _has_column(bind, table, "organization_id"):
            try:
                op.drop_index(f"ix_{table}_organization_id", table_name=table)
            except Exception:
                pass
            try:
                op.drop_column(table, "organization_id")
            except Exception:
                pass

    for t in [
        "notifications",
        "content_automation_rules",
        "content_templates",
        "content_tasks",
        "content_items",
        "kpi_targets",
        "budget_targets",
        "user_categories",
        "uploads",
        "calendar_entries",
        "activities",
        "deals",
        "contacts",
        "companies",
        "users",
    ]:
        drop_org(t)

    if _has_table(bind, "organizations"):
        try:
            op.drop_index("ix_organizations_id", table_name="organizations")
        except Exception:
            pass
        op.drop_table("organizations")


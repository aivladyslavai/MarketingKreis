"""jobs_perf_org

Revision ID: 20260120_0007
Revises: 20260120_0006
Create Date: 2026-01-20

- Add organization_id to jobs and performance_metrics and backfill
"""

from alembic import op
import sqlalchemy as sa


# Alembic's default version table uses VARCHAR(32), so keep revision <= 32 chars.
revision = "20260120_0007"
down_revision = "20260120_0006"
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
    Ensure a default organization exists and return its id.
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
    try:
        op.execute(sa.text("insert into organizations (id, name) values (1, 'Default')"))
        return 1
    except Exception:
        return 1


def upgrade() -> None:
    bind = op.get_bind()

    # If someone runs this migration standalone, ensure organizations exist.
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

    def add_org(table: str) -> None:
        if not _has_table(bind, table):
            return
        if not _has_column(bind, table, "organization_id"):
            op.add_column(table, sa.Column("organization_id", sa.Integer(), nullable=True))

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
                    pass
        try:
            op.create_index(f"ix_{table}_organization_id", table, ["organization_id"])
        except Exception:
            pass
        try:
            op.execute(
                sa.text(f"update {table} set organization_id = :oid where organization_id is null").bindparams(
                    oid=default_org_id
                )
            )
        except Exception:
            pass

    add_org("jobs")
    add_org("performance_metrics")


def downgrade() -> None:
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

    drop_org("performance_metrics")
    drop_org("jobs")


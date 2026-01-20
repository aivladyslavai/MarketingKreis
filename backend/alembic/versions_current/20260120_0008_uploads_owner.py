"""uploads_owner

Revision ID: 20260120_0008
Revises: 20260120_0007
Create Date: 2026-01-20

- Add owner_id to uploads to represent file ownership
"""

from alembic import op
import sqlalchemy as sa


revision = "20260120_0008"
down_revision = "20260120_0007"
branch_labels = None
depends_on = None


def _has_table(bind, table: str) -> bool:
    insp = sa.inspect(bind)
    return insp.has_table(table)


def _has_column(bind, table: str, column: str) -> bool:
    insp = sa.inspect(bind)
    cols = [c["name"] for c in insp.get_columns(table)]
    return column in cols


def _dialect(bind) -> str:
    try:
        return (bind.dialect.name or "").lower()
    except Exception:
        return ""


def upgrade() -> None:
    bind = op.get_bind()
    if not _has_table(bind, "uploads"):
        return

    if not _has_column(bind, "uploads", "owner_id"):
        op.add_column("uploads", sa.Column("owner_id", sa.Integer(), nullable=True))

    # FK best-effort (safe to skip on sqlite)
    if _dialect(bind) == "postgresql":
        try:
            op.create_foreign_key(
                "fk_uploads_owner_id",
                "uploads",
                "users",
                ["owner_id"],
                ["id"],
                ondelete="SET NULL",
            )
        except Exception:
            pass

    try:
        op.create_index("ix_uploads_owner_id", "uploads", ["owner_id"])
    except Exception:
        pass


def downgrade() -> None:
    bind = op.get_bind()
    if not _has_table(bind, "uploads"):
        return
    if _has_column(bind, "uploads", "owner_id"):
        try:
            op.drop_index("ix_uploads_owner_id", table_name="uploads")
        except Exception:
            pass
        try:
            op.drop_column("uploads", "owner_id")
        except Exception:
            pass


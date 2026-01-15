"""calendar_recurrence

Revision ID: 20260115_0004
Revises: 20260115_0003
Create Date: 2026-01-15

- Persist calendar category + recurrence in DB (cross-browser)
"""

from alembic import op
import sqlalchemy as sa

# Alembic's default version table uses VARCHAR(32), so keep revision <= 32 chars.
revision = "20260115_0004"
down_revision = "20260115_0003"
branch_labels = None
depends_on = None


def _has_table(bind, table: str) -> bool:
    insp = sa.inspect(bind)
    return insp.has_table(table)


def _has_column(bind, table: str, column: str) -> bool:
    insp = sa.inspect(bind)
    cols = [c["name"] for c in insp.get_columns(table)]
    return column in cols


def upgrade() -> None:
    bind = op.get_bind()
    if not _has_table(bind, "calendar_entries"):
        return

    # Simple metadata
    if not _has_column(bind, "calendar_entries", "category"):
        op.add_column("calendar_entries", sa.Column("category", sa.String(length=255), nullable=True))
    if not _has_column(bind, "calendar_entries", "location"):
        op.add_column("calendar_entries", sa.Column("location", sa.String(length=255), nullable=True))
    if not _has_column(bind, "calendar_entries", "priority"):
        op.add_column("calendar_entries", sa.Column("priority", sa.String(length=20), nullable=True))

    # JSON fields (recurrence, attendees, exceptions)
    if not _has_column(bind, "calendar_entries", "attendees"):
        op.add_column("calendar_entries", sa.Column("attendees", sa.JSON(), nullable=True))
    if not _has_column(bind, "calendar_entries", "recurrence"):
        op.add_column("calendar_entries", sa.Column("recurrence", sa.JSON(), nullable=True))
    if not _has_column(bind, "calendar_entries", "recurrence_exceptions"):
        op.add_column("calendar_entries", sa.Column("recurrence_exceptions", sa.JSON(), nullable=True))


def downgrade() -> None:
    # Best-effort downgrade (not recommended in prod)
    bind = op.get_bind()
    if not _has_table(bind, "calendar_entries"):
        return

    for col in [
        "recurrence_exceptions",
        "recurrence",
        "attendees",
        "priority",
        "location",
        "category",
    ]:
        if _has_column(bind, "calendar_entries", col):
            op.drop_column("calendar_entries", col)


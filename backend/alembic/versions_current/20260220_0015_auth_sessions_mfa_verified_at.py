"""auth_sessions_mfa_verified_at

Revision ID: 20260220_0015
Revises: 20260210_0014
Create Date: 2026-02-20

- Add mfa_verified_at to auth_sessions for admin step-up (2FA confirmation).
"""

from alembic import op
import sqlalchemy as sa


revision = "20260220_0015"
down_revision = "20260210_0014"
branch_labels = None
depends_on = None


def _has_column(bind, table: str, column: str) -> bool:
    insp = sa.inspect(bind)
    cols = [c.get("name") for c in insp.get_columns(table)]
    return column in cols


def upgrade() -> None:
    bind = op.get_bind()
    # Backward-compatible: table exists but without the new column.
    if not _has_column(bind, "auth_sessions", "mfa_verified_at"):
        op.add_column("auth_sessions", sa.Column("mfa_verified_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    try:
        if _has_column(bind, "auth_sessions", "mfa_verified_at"):
            op.drop_column("auth_sessions", "mfa_verified_at")
    except Exception:
        pass


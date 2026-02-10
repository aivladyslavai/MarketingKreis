"""user_totp_recovery_codes

Revision ID: 20260210_0013
Revises: 20260210_0012
Create Date: 2026-02-10

- Add TOTP recovery codes storage to users.
"""

from alembic import op
import sqlalchemy as sa


revision = "20260210_0013"
down_revision = "20260210_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = {c.get("name") for c in insp.get_columns("users")} if insp.has_table("users") else set()
    if "totp_recovery_codes" not in cols:
        op.add_column("users", sa.Column("totp_recovery_codes", sa.JSON(), nullable=True))


def downgrade() -> None:
    try:
        op.drop_column("users", "totp_recovery_codes")
    except Exception:
        pass


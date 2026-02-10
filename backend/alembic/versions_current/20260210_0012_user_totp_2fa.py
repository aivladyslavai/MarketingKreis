"""user_totp_2fa

Revision ID: 20260210_0012
Revises: 20260210_0011
Create Date: 2026-02-10

- Add TOTP 2FA fields to users.
"""

from alembic import op
import sqlalchemy as sa


revision = "20260210_0012"
down_revision = "20260210_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = {c.get("name") for c in insp.get_columns("users")} if insp.has_table("users") else set()

    if "totp_enabled" not in cols:
        op.add_column("users", sa.Column("totp_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    if "totp_secret_enc" not in cols:
        op.add_column("users", sa.Column("totp_secret_enc", sa.Text(), nullable=True))
    if "totp_confirmed_at" not in cols:
        op.add_column("users", sa.Column("totp_confirmed_at", sa.DateTime(timezone=True), nullable=True))
    if "totp_last_used_step" not in cols:
        op.add_column("users", sa.Column("totp_last_used_step", sa.Integer(), nullable=True))


def downgrade() -> None:
    # Best-effort: some DBs might not support IF EXISTS here.
    for col in ["totp_last_used_step", "totp_confirmed_at", "totp_secret_enc", "totp_enabled"]:
        try:
            op.drop_column("users", col)
        except Exception:
            pass

"""user_totp_2fa

Revision ID: 20260210_0012
Revises: 20260210_0011
Create Date: 2026-02-10

- Add TOTP 2FA fields to users table.
"""

from alembic import op
import sqlalchemy as sa


revision = "20260210_0012"
down_revision = "20260210_0011"
branch_labels = None
depends_on = None


def _has_column(bind, table: str, column: str) -> bool:
    insp = sa.inspect(bind)
    cols = [c.get("name") for c in insp.get_columns(table)]
    return column in cols


def upgrade() -> None:
    bind = op.get_bind()
    if not _has_column(bind, "users", "totp_enabled"):
        op.add_column("users", sa.Column("totp_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    if not _has_column(bind, "users", "totp_secret_enc"):
        op.add_column("users", sa.Column("totp_secret_enc", sa.Text(), nullable=True))
    if not _has_column(bind, "users", "totp_confirmed_at"):
        op.add_column("users", sa.Column("totp_confirmed_at", sa.DateTime(timezone=True), nullable=True))
    if not _has_column(bind, "users", "totp_last_used_step"):
        op.add_column("users", sa.Column("totp_last_used_step", sa.Integer(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    # Best-effort, some DBs may not support drop_column safely.
    for col in ["totp_last_used_step", "totp_confirmed_at", "totp_secret_enc", "totp_enabled"]:
        try:
            if _has_column(bind, "users", col):
                op.drop_column("users", col)
        except Exception:
            pass


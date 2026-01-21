"""auth_sessions_refresh_tokens

Revision ID: 20260121_0009
Revises: 20260120_0008
Create Date: 2026-01-21

- Add auth_sessions and auth_refresh_tokens for refresh-token rotation + revocation
"""

from alembic import op
import sqlalchemy as sa


revision = "20260121_0009"
down_revision = "20260120_0008"
branch_labels = None
depends_on = None


def _has_table(bind, table: str) -> bool:
    insp = sa.inspect(bind)
    return insp.has_table(table)


def upgrade() -> None:
    bind = op.get_bind()

    if not _has_table(bind, "auth_sessions"):
        op.create_table(
            "auth_sessions",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("user_agent", sa.Text(), nullable=True),
            sa.Column("ip", sa.String(length=64), nullable=True),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("revoked_reason", sa.String(length=255), nullable=True),
            sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        try:
            op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
        except Exception:
            pass
        try:
            op.create_index("ix_auth_sessions_revoked_at", "auth_sessions", ["revoked_at"])
        except Exception:
            pass

    if not _has_table(bind, "auth_refresh_tokens"):
        op.create_table(
            "auth_refresh_tokens",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("session_id", sa.String(length=36), nullable=False),
            sa.Column("token_jti", sa.String(length=64), nullable=False),
            sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("replaced_by_jti", sa.String(length=64), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        try:
            op.create_index("ix_auth_refresh_tokens_session_id", "auth_refresh_tokens", ["session_id"])
        except Exception:
            pass
        try:
            op.create_index(
                "ux_auth_refresh_tokens_token_jti",
                "auth_refresh_tokens",
                ["token_jti"],
                unique=True,
            )
        except Exception:
            pass
        try:
            op.create_index("ix_auth_refresh_tokens_revoked_at", "auth_refresh_tokens", ["revoked_at"])
        except Exception:
            pass


def downgrade() -> None:
    bind = op.get_bind()
    if _has_table(bind, "auth_refresh_tokens"):
        try:
            op.drop_index("ix_auth_refresh_tokens_revoked_at", table_name="auth_refresh_tokens")
        except Exception:
            pass
        try:
            op.drop_index("ux_auth_refresh_tokens_token_jti", table_name="auth_refresh_tokens")
        except Exception:
            pass
        try:
            op.drop_index("ix_auth_refresh_tokens_session_id", table_name="auth_refresh_tokens")
        except Exception:
            pass
        try:
            op.drop_table("auth_refresh_tokens")
        except Exception:
            pass

    if _has_table(bind, "auth_sessions"):
        try:
            op.drop_index("ix_auth_sessions_revoked_at", table_name="auth_sessions")
        except Exception:
            pass
        try:
            op.drop_index("ix_auth_sessions_user_id", table_name="auth_sessions")
        except Exception:
            pass
        try:
            op.drop_table("auth_sessions")
        except Exception:
            pass


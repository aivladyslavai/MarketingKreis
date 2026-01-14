"""production_hardening

Revision ID: 20260113_0002
Revises: 20260113_0001
Create Date: 2026-01-13

- Enforce case-insensitive uniqueness for users.email (Postgres functional unique index)
- Store uploads file bytes inside Postgres (uploads.content + checksum) so free-tier deploys don't lose files
"""

from alembic import op
import sqlalchemy as sa

# Alembic's default version table uses VARCHAR(32), so keep revision <= 32 chars.
revision = "20260113_0002"
down_revision = "20260113_0001"
branch_labels = None
depends_on = None


def _has_column(bind, table: str, column: str) -> bool:
    insp = sa.inspect(bind)
    cols = [c["name"] for c in insp.get_columns(table)]
    return column in cols


def _has_index(bind, index_name: str) -> bool:
    res = bind.execute(sa.text("select to_regclass(:name)"), {"name": index_name}).scalar()
    return res is not None


def upgrade() -> None:
    bind = op.get_bind()

    # 1) Case-insensitive uniqueness for emails
    # Ensure all existing emails are lowercased before adding index.
    bind.execute(sa.text("update users set email = lower(email) where email is not null;"))
    if not _has_index(bind, "public.ux_users_email_lower"):
        # Use raw SQL for functional index to avoid cross-version Alembic API quirks.
        op.execute(sa.text("create unique index ux_users_email_lower on users (lower(email));"))

    # 2) Upload content persistence in DB
    if not _has_column(bind, "uploads", "content"):
        op.add_column("uploads", sa.Column("content", sa.LargeBinary(), nullable=True))
    if not _has_column(bind, "uploads", "sha256"):
        op.add_column("uploads", sa.Column("sha256", sa.String(length=64), nullable=True))
        op.create_index("ix_uploads_sha256", "uploads", ["sha256"])
    if not _has_column(bind, "uploads", "stored_in_db"):
        op.add_column(
            "uploads",
            sa.Column("stored_in_db", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        )


def downgrade() -> None:
    # Best-effort downgrade (not recommended in prod)
    bind = op.get_bind()
    if _has_index(bind, "public.ux_users_email_lower"):
        op.drop_index("ux_users_email_lower", table_name="users")

    # uploads columns
    if _has_column(bind, "uploads", "stored_in_db"):
        op.drop_column("uploads", "stored_in_db")
    if _has_column(bind, "uploads", "sha256"):
        try:
            op.drop_index("ix_uploads_sha256", table_name="uploads")
        except Exception:
            pass
        op.drop_column("uploads", "sha256")
    if _has_column(bind, "uploads", "content"):
        op.drop_column("uploads", "content")


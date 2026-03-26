"""jobs phase compatibility

Revision ID: 20260326_0012
Revises: 20251221_0011_company_onboarding_and_invites
Create Date: 2026-03-26

Ensure the jobs table has the runtime columns expected by the current code.
Older deployments created `stage` while the ORM now uses `phase`.
"""

from alembic import op
import sqlalchemy as sa


revision = "20260326_0012"
down_revision = "20251221_0011_company_onboarding_and_invites"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if not insp.has_table("jobs"):
        return

    columns = {c["name"] for c in insp.get_columns("jobs")}

    if "phase" not in columns:
        op.add_column("jobs", sa.Column("phase", sa.String(length=50), nullable=True))
    if "progress" not in columns:
        op.add_column("jobs", sa.Column("progress", sa.Integer(), nullable=True))
    if "upload_id" not in columns:
        op.add_column("jobs", sa.Column("upload_id", sa.Integer(), nullable=True))
    if "cancelled_at" not in columns:
        op.add_column("jobs", sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True))

    columns = {c["name"] for c in sa.inspect(bind).get_columns("jobs")}
    if "stage" in columns and "phase" in columns:
        op.execute(sa.text("update jobs set phase = stage where phase is null and stage is not null"))


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    if not insp.has_table("jobs"):
        return

    columns = {c["name"] for c in insp.get_columns("jobs")}
    if "cancelled_at" in columns:
        op.drop_column("jobs", "cancelled_at")
    if "upload_id" in columns:
        op.drop_column("jobs", "upload_id")
    if "progress" in columns:
        op.drop_column("jobs", "progress")
    if "phase" in columns:
        op.drop_column("jobs", "phase")

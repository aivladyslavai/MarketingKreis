"""upload_audit_log and job.upload_id

Revision ID: 20251219_0009_upload_audit_and_job_upload
Revises: 20251218_0008_add_category_name_to_activities
Create Date: 2025-12-19

"""
from alembic import op
import sqlalchemy as sa


revision = "20251219_0009_upload_audit_and_job_upload"
down_revision = "20251218_0008_add_category_name_to_activities"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "upload_audit_log",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("upload_id", sa.Integer(), sa.ForeignKey("uploads.id", ondelete="CASCADE"), nullable=True, index=True),
        sa.Column("actor_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(50), nullable=False),  # imported, deleted, retried
        sa.Column("details", sa.Text(), nullable=True),  # JSON: totals, errors_count, etc.
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_upload_audit_log_upload_id", "upload_audit_log", ["upload_id"])
    op.create_index("ix_upload_audit_log_created_at", "upload_audit_log", ["created_at"])

    op.add_column("jobs", sa.Column("upload_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_jobs_upload_id", "jobs", "uploads", ["upload_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_jobs_upload_id", "jobs", ["upload_id"])


def downgrade() -> None:
    op.drop_index("ix_jobs_upload_id", table_name="jobs")
    op.drop_constraint("fk_jobs_upload_id", "jobs", type_="foreignkey")
    op.drop_column("jobs", "upload_id")
    op.drop_index("ix_upload_audit_log_created_at", table_name="upload_audit_log")
    op.drop_index("ix_upload_audit_log_upload_id", table_name="upload_audit_log")
    op.drop_table("upload_audit_log")

"""upload_audit_log SET NULL + job progress/stage

Revision ID: 20251220_0010
Revises: 20251219_0009_upload_audit_and_job_upload
Create Date: 2025-12-20

"""
from alembic import op
import sqlalchemy as sa


revision = "20251220_0010"
down_revision = "20251219_0009_upload_audit_and_job_upload"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Preserve audit trail when upload is deleted: SET NULL instead of CASCADE
    op.drop_constraint("upload_audit_log_upload_id_fkey", "upload_audit_log", type_="foreignkey")
    op.create_foreign_key(
        "upload_audit_log_upload_id_fkey",
        "upload_audit_log",
        "uploads",
        ["upload_id"],
        ["id"],
        ondelete="SET NULL",
    )
    # Job progress/stage for import UI
    op.add_column("jobs", sa.Column("stage", sa.String(50), nullable=True))
    op.add_column("jobs", sa.Column("progress", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "progress")
    op.drop_column("jobs", "stage")
    op.drop_constraint("upload_audit_log_upload_id_fkey", "upload_audit_log", type_="foreignkey")
    op.create_foreign_key(
        "upload_audit_log_upload_id_fkey",
        "upload_audit_log",
        "uploads",
        ["upload_id"],
        ["id"],
        ondelete="CASCADE",
    )

"""company_extra_fields

Revision ID: 20260115_0003
Revises: 20260113_0002
Create Date: 2026-01-15

- Add optional extra CRM fields to companies table (contact person + business info)
"""

from alembic import op
import sqlalchemy as sa

# Alembic's default version table uses VARCHAR(32), so keep revision <= 32 chars.
revision = "20260115_0003"
down_revision = "20260113_0002"
branch_labels = None
depends_on = None


def _has_column(bind, table: str, column: str) -> bool:
    insp = sa.inspect(bind)
    cols = [c["name"] for c in insp.get_columns(table)]
    return column in cols


def upgrade() -> None:
    bind = op.get_bind()

    # Contact person (optional)
    if not _has_column(bind, "companies", "contact_person_name"):
        op.add_column("companies", sa.Column("contact_person_name", sa.String(length=255), nullable=True))
    if not _has_column(bind, "companies", "contact_person_position"):
        op.add_column("companies", sa.Column("contact_person_position", sa.String(length=100), nullable=True))
    if not _has_column(bind, "companies", "contact_person_email"):
        op.add_column("companies", sa.Column("contact_person_email", sa.String(length=255), nullable=True))
    if not _has_column(bind, "companies", "contact_person_phone"):
        op.add_column("companies", sa.Column("contact_person_phone", sa.String(length=50), nullable=True))

    # Business info (optional)
    if not _has_column(bind, "companies", "vat_id"):
        op.add_column("companies", sa.Column("vat_id", sa.String(length=64), nullable=True))
    if not _has_column(bind, "companies", "lead_source"):
        op.add_column("companies", sa.Column("lead_source", sa.String(length=100), nullable=True))
    if not _has_column(bind, "companies", "priority"):
        op.add_column("companies", sa.Column("priority", sa.String(length=20), nullable=True))
    if not _has_column(bind, "companies", "next_follow_up_at"):
        op.add_column("companies", sa.Column("next_follow_up_at", sa.DateTime(timezone=True), nullable=True))
    if not _has_column(bind, "companies", "linkedin_url"):
        op.add_column("companies", sa.Column("linkedin_url", sa.String(length=255), nullable=True))
    if not _has_column(bind, "companies", "tags"):
        op.add_column("companies", sa.Column("tags", sa.String(length=255), nullable=True))


def downgrade() -> None:
    # Best-effort downgrade (not recommended in prod)
    bind = op.get_bind()

    for col in [
        "tags",
        "linkedin_url",
        "next_follow_up_at",
        "priority",
        "lead_source",
        "vat_id",
        "contact_person_phone",
        "contact_person_email",
        "contact_person_position",
        "contact_person_name",
    ]:
        if _has_column(bind, "companies", col):
            op.drop_column("companies", col)


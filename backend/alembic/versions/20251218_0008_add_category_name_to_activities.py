"""add category_name to activities

Revision ID: 20251218_0008_add_category_name_to_activities
Revises: 20251217_0007_add_owner_to_activities
Create Date: 2025-12-18
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20251218_0008_add_category_name_to_activities"
down_revision = "20251217_0007_add_owner_to_activities"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("activities", sa.Column("category_name", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("activities", "category_name")




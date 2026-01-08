"""add owner_id to activities

Revision ID: 20251217_0007_add_owner_to_activities
Revises: 20251029_0006
Create Date: 2025-12-17
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20251217_0007_add_owner_to_activities"
down_revision = "20251029_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
  # Add nullable owner_id column and FK to users.id
  op.add_column(
      "activities",
      sa.Column("owner_id", sa.Integer(), nullable=True),
  )
  op.create_index("ix_activities_owner_id", "activities", ["owner_id"])
  op.create_foreign_key(
      "fk_activities_owner_id_users",
      "activities",
      "users",
      ["owner_id"],
      ["id"],
      ondelete="SET NULL",
  )


def downgrade() -> None:
  op.drop_constraint("fk_activities_owner_id_users", "activities", type_="foreignkey")
  op.drop_index("ix_activities_owner_id", table_name="activities")
  op.drop_column("activities", "owner_id")



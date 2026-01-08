"""add description column to calendar_entries

Revision ID: 20251029_0006
Revises: 20251013_0004_add_activity_timestamps
Create Date: 2025-10-29
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251029_0006'
down_revision = '20251013_0004_add_activity_timestamps'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('calendar_entries') as batch_op:
        batch_op.add_column(sa.Column('description', sa.String(length=2048), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('calendar_entries') as batch_op:
        batch_op.drop_column('description')











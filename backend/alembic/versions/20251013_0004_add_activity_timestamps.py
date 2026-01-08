from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251013_0004_ts'
down_revision = '20241001_0003_add_crm_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('activities', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))
    op.add_column('activities', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))


def downgrade() -> None:
    op.drop_column('activities', 'updated_at')
    op.drop_column('activities', 'created_at')



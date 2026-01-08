from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20240902_0002_jobs_and_indexes'
down_revision = '20240901_0001_init'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # jobs table
    op.create_table(
        'jobs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('rq_id', sa.String(length=64), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='queued'),
        sa.Column('result', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_jobs_id', 'jobs', ['id'])
    op.create_index('ix_jobs_rq_id', 'jobs', ['rq_id'])

    # indexes for performance/calendar
    op.create_index('ix_performance_activity_id', 'performance', ['activity_id'])
    op.create_index('ix_performance_created_at', 'performance', ['created_at'])
    op.create_index('ix_calendar_activity_id', 'calendar', ['activity_id'])


def downgrade() -> None:
    op.drop_index('ix_calendar_activity_id', table_name='calendar')
    op.drop_index('ix_performance_created_at', table_name='performance')
    op.drop_index('ix_performance_activity_id', table_name='performance')
    op.drop_index('ix_jobs_rq_id', table_name='jobs')
    op.drop_index('ix_jobs_id', table_name='jobs')
    op.drop_table('jobs')




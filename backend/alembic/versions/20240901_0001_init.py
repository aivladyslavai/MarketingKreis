from alembic import op
import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as psql

# revision identifiers, used by Alembic.
revision = '20240901_0001_init'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enums will be created automatically when tables are created (using enum names, not values)
    user_role = sa.Enum('admin', 'marketing_manager', 'viewer', name='userrole')
    activity_type = sa.Enum('branding', 'sales', 'employer_branding', 'kundenpflege', name='activitytype')
    upload_type = sa.Enum('csv', 'excel', name='uploadtype')

    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('role', user_role, nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'])

    op.create_table(
        'activities',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('type', activity_type, nullable=False),
        sa.Column('budget', sa.Numeric(12, 2), nullable=True),
        sa.Column('expected_output', sa.String(length=1024), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
    )
    op.create_index('ix_activities_id', 'activities', ['id'])

    op.create_table(
        'calendar',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('week', sa.Integer(), nullable=False),
        sa.Column('activity_id', sa.Integer(), sa.ForeignKey('activities.id', ondelete='CASCADE'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
    )
    op.create_index('ix_calendar_id', 'calendar', ['id'])

    op.create_table(
        'performance',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('activity_id', sa.Integer(), sa.ForeignKey('activities.id', ondelete='CASCADE'), nullable=False),
        sa.Column('leads', sa.Integer(), nullable=True),
        sa.Column('impressions', sa.Integer(), nullable=True),
        sa.Column('reach', sa.Integer(), nullable=True),
        sa.Column('spend', sa.Numeric(12, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_performance_id', 'performance', ['id'])

    op.create_table(
        'uploads',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('filename', sa.String(length=512), nullable=False),
        sa.Column('type', upload_type, nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_uploads_id', 'uploads', ['id'])


def downgrade() -> None:
    op.drop_table('uploads')
    op.drop_index('ix_uploads_id', table_name='uploads')
    op.drop_table('performance')
    op.drop_index('ix_performance_id', table_name='performance')
    op.drop_table('calendar')
    op.drop_index('ix_calendar_id', table_name='calendar')
    op.drop_table('activities')
    op.drop_index('ix_activities_id', table_name='activities')
    op.drop_table('users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_id', table_name='users')

    upload_type = sa.Enum('CSV', 'Excel', name='uploadtype')
    activity_type = sa.Enum('Branding', 'Sales', 'Employer Branding', 'Kundenpflege', name='activitytype')
    user_role = sa.Enum('Admin', 'Marketing Manager', 'Viewer', name='userrole')

    upload_type.drop(op.get_bind(), checkfirst=True)
    activity_type.drop(op.get_bind(), checkfirst=True)
    user_role.drop(op.get_bind(), checkfirst=True)



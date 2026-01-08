from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20241001_0003_add_crm_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'companies',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('address', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('revenue', sa.Numeric(14, 2), nullable=True),
        sa.Column('employees', sa.Integer(), nullable=True),
        sa.Column('notes', sa.String(length=1024), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_companies_id', 'companies', ['id'])
    op.create_index('ix_companies_name', 'companies', ['name'])

    op.create_table(
        'contacts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('position', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_contacts_id', 'contacts', ['id'])
    op.create_index('ix_contacts_company_id', 'contacts', ['company_id'])
    op.create_index('ix_contacts_email', 'contacts', ['email'])

    op.create_table(
        'deals',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id', ondelete='SET NULL'), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('value', sa.Numeric(14, 2), nullable=True),
        sa.Column('stage', sa.String(length=30), nullable=False, server_default='lead'),
        sa.Column('probability', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('expected_close_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.String(length=1024), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_deals_id', 'deals', ['id'])
    op.create_index('ix_deals_company_id', 'deals', ['company_id'])
    op.create_index('ix_deals_stage', 'deals', ['stage'])


def downgrade() -> None:
    op.drop_index('ix_deals_stage', table_name='deals')
    op.drop_index('ix_deals_company_id', table_name='deals')
    op.drop_index('ix_deals_id', table_name='deals')
    op.drop_table('deals')

    op.drop_index('ix_contacts_email', table_name='contacts')
    op.drop_index('ix_contacts_company_id', table_name='contacts')
    op.drop_index('ix_contacts_id', table_name='contacts')
    op.drop_table('contacts')

    op.drop_index('ix_companies_name', table_name='companies')
    op.drop_index('ix_companies_id', table_name='companies')
    op.drop_table('companies')



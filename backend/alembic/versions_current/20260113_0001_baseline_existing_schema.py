"""baseline_existing_schema

Revision ID: 20260113_0001
Revises: 
Create Date: 2026-01-13

This is a NO-OP baseline revision used to "adopt" an existing database schema.
It allows creating the alembic_version table via `alembic stamp head`
without running historical migrations that may not match the current schema.
"""

from alembic import op

# revision identifiers, used by Alembic.
# Alembic's default version table uses VARCHAR(32), so keep revision <= 32 chars.
revision = "20260113_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # No-op: schema already exists.
    pass


def downgrade() -> None:
    # No-op: baseline cannot be downgraded safely.
    pass


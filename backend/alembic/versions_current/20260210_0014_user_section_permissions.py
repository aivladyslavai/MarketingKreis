"""user_section_permissions

Revision ID: 20260210_0014
Revises: 20260210_0013
Create Date: 2026-02-10

- Add per-section permissions overrides to users.
"""

from alembic import op
import sqlalchemy as sa


revision = "20260210_0014"
down_revision = "20260210_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = {c.get("name") for c in insp.get_columns("users")} if insp.has_table("users") else set()
    if "section_permissions" not in cols:
        op.add_column("users", sa.Column("section_permissions", sa.JSON(), nullable=True))


def downgrade() -> None:
    try:
        op.drop_column("users", "section_permissions")
    except Exception:
        pass

"""user_section_permissions

Revision ID: 20260210_0014
Revises: 20260210_0013
Create Date: 2026-02-10

- Add per-section permissions to users.
"""

from alembic import op
import sqlalchemy as sa


revision = "20260210_0014"
down_revision = "20260210_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    cols = {c.get("name") for c in insp.get_columns("users")} if insp.has_table("users") else set()
    if "section_permissions" not in cols:
        op.add_column("users", sa.Column("section_permissions", sa.JSON(), nullable=True))


def downgrade() -> None:
    try:
        op.drop_column("users", "section_permissions")
    except Exception:
        pass


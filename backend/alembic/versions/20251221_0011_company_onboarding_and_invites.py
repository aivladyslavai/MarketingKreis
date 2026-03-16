"""company onboarding and invites

Revision ID: 20251221_0011
Revises: 20251220_0010
Create Date: 2025-12-21
"""

from alembic import op
import sqlalchemy as sa


revision = "20251221_0011"
down_revision = "20251220_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'owner'")

    op.add_column("users", sa.Column("position_title", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("invited_by_user_id", sa.Integer(), nullable=True))
    op.create_index("ix_users_invited_by_user_id", "users", ["invited_by_user_id"])
    op.create_foreign_key(
        "users_invited_by_user_id_fkey",
        "users",
        "users",
        ["invited_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("organizations", sa.Column("industry", sa.String(length=255), nullable=True))
    op.add_column("organizations", sa.Column("team_size", sa.String(length=100), nullable=True))
    op.add_column("organizations", sa.Column("country", sa.String(length=120), nullable=True))
    op.add_column("organizations", sa.Column("language", sa.String(length=20), nullable=True))
    op.add_column("organizations", sa.Column("owner_user_id", sa.Integer(), nullable=True))
    op.add_column("organizations", sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_organizations_owner_user_id", "organizations", ["owner_user_id"])
    op.create_foreign_key(
        "organizations_owner_user_id_fkey",
        "organizations",
        "users",
        ["owner_user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "organization_invites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("section_permissions", sa.JSON(), nullable=True),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), nullable=True),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("accepted_by_user_id", sa.Integer(), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["accepted_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_organization_invites_email", "organization_invites", ["email"])
    op.create_index("ix_organization_invites_organization_id", "organization_invites", ["organization_id"])
    op.create_index("ix_organization_invites_token_hash", "organization_invites", ["token_hash"])

    # Backfill existing tenants/users so old accounts are not forced through onboarding.
    op.execute(
        """
        UPDATE users
        SET onboarding_completed_at = COALESCE(onboarding_completed_at, now())
        WHERE is_verified = true AND organization_id IS NOT NULL
        """
    )
    op.execute(
        """
        UPDATE organizations o
        SET onboarding_completed_at = COALESCE(o.onboarding_completed_at, now()),
            owner_user_id = COALESCE(
                o.owner_user_id,
                (
                    SELECT u.id
                    FROM users u
                    WHERE u.organization_id = o.id
                    ORDER BY
                        CASE
                            WHEN u.role::text = 'owner' THEN 0
                            WHEN u.role::text = 'admin' THEN 1
                            WHEN u.role::text = 'editor' THEN 2
                            ELSE 3
                        END,
                        u.created_at ASC,
                        u.id ASC
                    LIMIT 1
                )
            )
        """
    )


def downgrade() -> None:
    op.drop_index("ix_organization_invites_token_hash", table_name="organization_invites")
    op.drop_index("ix_organization_invites_organization_id", table_name="organization_invites")
    op.drop_index("ix_organization_invites_email", table_name="organization_invites")
    op.drop_table("organization_invites")

    op.drop_constraint("organizations_owner_user_id_fkey", "organizations", type_="foreignkey")
    op.drop_index("ix_organizations_owner_user_id", table_name="organizations")
    op.drop_column("organizations", "onboarding_completed_at")
    op.drop_column("organizations", "owner_user_id")
    op.drop_column("organizations", "language")
    op.drop_column("organizations", "country")
    op.drop_column("organizations", "team_size")
    op.drop_column("organizations", "industry")

    op.drop_constraint("users_invited_by_user_id_fkey", "users", type_="foreignkey")
    op.drop_index("ix_users_invited_by_user_id", table_name="users")
    op.drop_column("users", "invited_by_user_id")
    op.drop_column("users", "onboarding_completed_at")
    op.drop_column("users", "position_title")

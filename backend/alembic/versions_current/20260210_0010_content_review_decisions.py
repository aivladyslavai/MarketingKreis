"""content_review_decisions

Revision ID: 20260210_0010
Revises: 20260121_0009
Create Date: 2026-02-10

- Add content_item_review_decisions to track reviewer approve/reject.
"""

from alembic import op
import sqlalchemy as sa


revision = "20260210_0010"
down_revision = "20260121_0009"
branch_labels = None
depends_on = None


def _has_table(bind, table: str) -> bool:
    insp = sa.inspect(bind)
    return insp.has_table(table)


def upgrade() -> None:
    bind = op.get_bind()
    if _has_table(bind, "content_item_review_decisions"):
        return

    op.create_table(
        "content_item_review_decisions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("item_id", sa.Integer(), nullable=False),
        sa.Column("reviewer_id", sa.Integer(), nullable=False),
        sa.Column("decision", sa.String(length=20), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["item_id"], ["content_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"], ondelete="CASCADE"),
    )

    try:
        op.create_index("ix_content_item_review_decisions_item_id", "content_item_review_decisions", ["item_id"])
    except Exception:
        pass
    try:
        op.create_index("ix_content_item_review_decisions_reviewer_id", "content_item_review_decisions", ["reviewer_id"])
    except Exception:
        pass
    try:
        op.create_index(
            "ux_content_item_review_decisions_item_reviewer",
            "content_item_review_decisions",
            ["item_id", "reviewer_id"],
            unique=True,
        )
    except Exception:
        pass


def downgrade() -> None:
    bind = op.get_bind()
    if not _has_table(bind, "content_item_review_decisions"):
        return
    try:
        op.drop_index("ux_content_item_review_decisions_item_reviewer", table_name="content_item_review_decisions")
    except Exception:
        pass
    try:
        op.drop_index("ix_content_item_review_decisions_reviewer_id", table_name="content_item_review_decisions")
    except Exception:
        pass
    try:
        op.drop_index("ix_content_item_review_decisions_item_id", table_name="content_item_review_decisions")
    except Exception:
        pass
    try:
        op.drop_table("content_item_review_decisions")
    except Exception:
        pass


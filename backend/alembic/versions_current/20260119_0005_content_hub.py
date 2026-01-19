"""content_hub

Revision ID: 20260119_0005
Revises: 20260115_0004
Create Date: 2026-01-19

- Add Content Hub "Content Items" domain: items, assets, comments, checklist,
  versions, reviewers, audit log, templates, automation rules, notifications.
- Link editorial calendar via calendar_entries.content_item_id
- Link tasks to items via content_tasks.content_item_id + optional recurrence JSON
"""

from alembic import op
import sqlalchemy as sa

# Alembic's default version table uses VARCHAR(32), so keep revision <= 32 chars.
revision = "20260119_0005"
down_revision = "20260115_0004"
branch_labels = None
depends_on = None


def _has_table(bind, table: str) -> bool:
    insp = sa.inspect(bind)
    return insp.has_table(table)


def _has_column(bind, table: str, column: str) -> bool:
    insp = sa.inspect(bind)
    cols = [c["name"] for c in insp.get_columns(table)]
    return column in cols


def upgrade() -> None:
    bind = op.get_bind()

    # --- New tables ---
    if not _has_table(bind, "content_items"):
        op.create_table(
            "content_items",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("channel", sa.String(length=100), nullable=False, server_default="Website"),
            sa.Column("format", sa.String(length=100), nullable=True),
            sa.Column(
                "status",
                sa.Enum(
                    "IDEA",
                    "DRAFT",
                    "REVIEW",
                    "APPROVED",
                    "SCHEDULED",
                    "PUBLISHED",
                    "ARCHIVED",
                    "BLOCKED",
                    name="contentitemstatus",
                ),
                nullable=False,
                server_default="DRAFT",
            ),
            sa.Column("tags", sa.JSON(), nullable=True),
            sa.Column("brief", sa.Text(), nullable=True),
            sa.Column("body", sa.Text(), nullable=True),
            sa.Column("tone", sa.String(length=50), nullable=True),
            sa.Column("language", sa.String(length=10), nullable=True, server_default="de"),
            sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("company_id", sa.Integer(), nullable=True),
            sa.Column("project_id", sa.Integer(), nullable=True),
            sa.Column("activity_id", sa.Integer(), nullable=True),
            sa.Column("owner_id", sa.Integer(), nullable=True),
            sa.Column("blocked_reason", sa.String(length=255), nullable=True),
            sa.Column("blocked_by", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["project_id"], ["deals.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["activity_id"], ["activities.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="SET NULL"),
        )
        op.create_index("ix_content_items_owner_id", "content_items", ["owner_id"])
        op.create_index("ix_content_items_company_id", "content_items", ["company_id"])
        op.create_index("ix_content_items_project_id", "content_items", ["project_id"])
        op.create_index("ix_content_items_activity_id", "content_items", ["activity_id"])

    if not _has_table(bind, "content_item_reviewers"):
        op.create_table(
            "content_item_reviewers",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("item_id", sa.Integer(), nullable=False),
            sa.Column("reviewer_id", sa.Integer(), nullable=True),
            sa.Column("role", sa.String(length=50), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["item_id"], ["content_items.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"], ondelete="SET NULL"),
        )
        op.create_index("ix_content_item_reviewers_item_id", "content_item_reviewers", ["item_id"])
        op.create_index("ix_content_item_reviewers_reviewer_id", "content_item_reviewers", ["reviewer_id"])

    if not _has_table(bind, "content_item_comments"):
        op.create_table(
            "content_item_comments",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("item_id", sa.Integer(), nullable=False),
            sa.Column("author_id", sa.Integer(), nullable=True),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["item_id"], ["content_items.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="SET NULL"),
        )
        op.create_index("ix_content_item_comments_item_id", "content_item_comments", ["item_id"])
        op.create_index("ix_content_item_comments_author_id", "content_item_comments", ["author_id"])

    if not _has_table(bind, "content_item_checklist"):
        op.create_table(
            "content_item_checklist",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("item_id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("is_done", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["item_id"], ["content_items.id"], ondelete="CASCADE"),
        )
        op.create_index("ix_content_item_checklist_item_id", "content_item_checklist", ["item_id"])

    if not _has_table(bind, "content_item_assets"):
        op.create_table(
            "content_item_assets",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("item_id", sa.Integer(), nullable=False),
            sa.Column(
                "kind",
                sa.Enum("LINK", "UPLOAD", name="contentassetkind"),
                nullable=False,
                server_default="LINK",
            ),
            sa.Column("name", sa.String(length=255), nullable=True),
            sa.Column("url", sa.String(length=2048), nullable=True),
            sa.Column("upload_id", sa.Integer(), nullable=True),
            sa.Column("source", sa.String(length=50), nullable=True),
            sa.Column("mime_type", sa.String(length=100), nullable=True),
            sa.Column("size_bytes", sa.Integer(), nullable=True),
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["item_id"], ["content_items.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["upload_id"], ["uploads.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        )
        op.create_index("ix_content_item_assets_item_id", "content_item_assets", ["item_id"])
        op.create_index("ix_content_item_assets_upload_id", "content_item_assets", ["upload_id"])

    if not _has_table(bind, "content_item_versions"):
        op.create_table(
            "content_item_versions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("item_id", sa.Integer(), nullable=False),
            sa.Column("version", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=True),
            sa.Column("brief", sa.Text(), nullable=True),
            sa.Column("body", sa.Text(), nullable=True),
            sa.Column("meta", sa.JSON(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["item_id"], ["content_items.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        )
        op.create_index("ix_content_item_versions_item_id", "content_item_versions", ["item_id"])

    if not _has_table(bind, "content_item_audit_log"):
        op.create_table(
            "content_item_audit_log",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("item_id", sa.Integer(), nullable=False),
            sa.Column("actor_id", sa.Integer(), nullable=True),
            sa.Column("action", sa.String(length=100), nullable=False),
            sa.Column("data", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["item_id"], ["content_items.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        )
        op.create_index("ix_content_item_audit_log_item_id", "content_item_audit_log", ["item_id"])
        op.create_index("ix_content_item_audit_log_actor_id", "content_item_audit_log", ["actor_id"])

    if not _has_table(bind, "content_templates"):
        op.create_table(
            "content_templates",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column("description", sa.String(length=1024), nullable=True),
            sa.Column("channel", sa.String(length=100), nullable=True),
            sa.Column("format", sa.String(length=100), nullable=True),
            sa.Column("tags", sa.JSON(), nullable=True),
            sa.Column("checklist", sa.JSON(), nullable=True),
            sa.Column("tasks", sa.JSON(), nullable=True),
            sa.Column("reviewers", sa.JSON(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        )
        op.create_index("ix_content_templates_created_by", "content_templates", ["created_by"])

    if not _has_table(bind, "content_automation_rules"):
        op.create_table(
            "content_automation_rules",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("trigger", sa.String(length=60), nullable=False),
            sa.Column("template_id", sa.Integer(), nullable=True),
            sa.Column("config", sa.JSON(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["template_id"], ["content_templates.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        )
        op.create_index("ix_content_automation_rules_template_id", "content_automation_rules", ["template_id"])
        op.create_index("ix_content_automation_rules_created_by", "content_automation_rules", ["created_by"])

    if not _has_table(bind, "notifications"):
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("type", sa.String(length=60), nullable=False, server_default="info"),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("body", sa.String(length=2000), nullable=True),
            sa.Column("url", sa.String(length=2048), nullable=True),
            sa.Column("dedupe_key", sa.String(length=255), nullable=True, unique=True),
            sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        )
        op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    # --- Link columns ---
    if _has_table(bind, "calendar_entries") and not _has_column(bind, "calendar_entries", "content_item_id"):
        op.add_column("calendar_entries", sa.Column("content_item_id", sa.Integer(), nullable=True))
        op.create_index("ix_calendar_entries_content_item_id", "calendar_entries", ["content_item_id"])
        op.create_foreign_key(
            "fk_calendar_entries_content_item_id",
            "calendar_entries",
            "content_items",
            ["content_item_id"],
            ["id"],
            ondelete="SET NULL",
        )

    if _has_table(bind, "content_tasks"):
        if not _has_column(bind, "content_tasks", "content_item_id"):
            op.add_column("content_tasks", sa.Column("content_item_id", sa.Integer(), nullable=True))
            op.create_index("ix_content_tasks_content_item_id", "content_tasks", ["content_item_id"])
            op.create_foreign_key(
                "fk_content_tasks_content_item_id",
                "content_tasks",
                "content_items",
                ["content_item_id"],
                ["id"],
                ondelete="SET NULL",
            )
        if not _has_column(bind, "content_tasks", "recurrence"):
            op.add_column("content_tasks", sa.Column("recurrence", sa.JSON(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()

    # Best-effort downgrade (not recommended in prod).
    if _has_table(bind, "content_tasks"):
        for col in ["recurrence", "content_item_id"]:
            if _has_column(bind, "content_tasks", col):
                try:
                    op.drop_column("content_tasks", col)
                except Exception:
                    pass

    if _has_table(bind, "calendar_entries") and _has_column(bind, "calendar_entries", "content_item_id"):
        try:
            op.drop_constraint("fk_calendar_entries_content_item_id", "calendar_entries", type_="foreignkey")
        except Exception:
            pass
        try:
            op.drop_index("ix_calendar_entries_content_item_id", table_name="calendar_entries")
        except Exception:
            pass
        try:
            op.drop_column("calendar_entries", "content_item_id")
        except Exception:
            pass

    for table in [
        "notifications",
        "content_automation_rules",
        "content_templates",
        "content_item_audit_log",
        "content_item_versions",
        "content_item_assets",
        "content_item_checklist",
        "content_item_comments",
        "content_item_reviewers",
        "content_items",
    ]:
        if _has_table(bind, table):
            try:
                op.drop_table(table)
            except Exception:
                pass


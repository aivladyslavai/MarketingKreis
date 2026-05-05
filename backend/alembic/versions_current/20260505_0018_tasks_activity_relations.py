"""tasks_activity_relations

Revision ID: 20260505_0018
Revises: 20260427_0017
Create Date: 2026-05-05

- Add direct company/project links to activities.
- Add product-level tasks table linked to company/project/activity/event.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260505_0018"
down_revision = "20260427_0017"
branch_labels = None
depends_on = None


def _has_table(bind, table: str) -> bool:
    return sa.inspect(bind).has_table(table)


def _has_column(bind, table: str, column: str) -> bool:
    insp = sa.inspect(bind)
    if not insp.has_table(table):
        return False
    return column in {c["name"] for c in insp.get_columns(table)}


def _has_index(bind, table: str, name: str) -> bool:
    insp = sa.inspect(bind)
    if not insp.has_table(table):
        return False
    return any(idx.get("name") == name for idx in insp.get_indexes(table))


def _has_fk(bind, table: str, name: str) -> bool:
    insp = sa.inspect(bind)
    if not insp.has_table(table):
        return False
    return any(fk.get("name") == name for fk in insp.get_foreign_keys(table))


def _dialect(bind) -> str:
    return (getattr(bind.dialect, "name", "") or "").lower()


def upgrade() -> None:
    bind = op.get_bind()

    if _has_table(bind, "activities"):
        for column in [
            sa.Column("company_id", sa.Integer(), nullable=True),
            sa.Column("project_id", sa.Integer(), nullable=True),
        ]:
            if not _has_column(bind, "activities", column.name):
                op.add_column("activities", column)
        for name, cols in [
            ("ix_activities_company_id", ["company_id"]),
            ("ix_activities_project_id", ["project_id"]),
        ]:
            if not _has_index(bind, "activities", name):
                op.create_index(name, "activities", cols)
        if _dialect(bind) == "postgresql":
            if not _has_fk(bind, "activities", "fk_activities_company_id"):
                op.create_foreign_key("fk_activities_company_id", "activities", "companies", ["company_id"], ["id"], ondelete="SET NULL")
            if not _has_fk(bind, "activities", "fk_activities_project_id"):
                op.create_foreign_key("fk_activities_project_id", "activities", "deals", ["project_id"], ["id"], ondelete="SET NULL")

        if _dialect(bind) == "postgresql":
            bind.execute(
                sa.text(
                    "update activities a set project_id = ce.project_id "
                    "from calendar_entries ce "
                    "where a.project_id is null and ce.activity_id = a.id and ce.project_id is not null"
                )
            )
            bind.execute(
                sa.text(
                    "update activities a set company_id = coalesce(ce.company_id, d.company_id) "
                    "from calendar_entries ce left join deals d on d.id = ce.project_id "
                    "where a.company_id is null and ce.activity_id = a.id "
                    "and coalesce(ce.company_id, d.company_id) is not null"
                )
            )

    if not _has_table(bind, "tasks"):
        op.create_table(
            "tasks",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("organization_id", sa.Integer(), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.String(length=2000), nullable=True),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="TODO"),
            sa.Column("priority", sa.String(length=20), nullable=False, server_default="MEDIUM"),
            sa.Column("due_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("company_id", sa.Integer(), nullable=True),
            sa.Column("project_id", sa.Integer(), nullable=True),
            sa.Column("activity_id", sa.Integer(), nullable=True),
            sa.Column("event_id", sa.Integer(), nullable=True),
            sa.Column("owner_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], name="fk_tasks_organization_id", ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], name="fk_tasks_company_id", ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["project_id"], ["deals.id"], name="fk_tasks_project_id", ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["activity_id"], ["activities.id"], name="fk_tasks_activity_id", ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["event_id"], ["calendar_entries.id"], name="fk_tasks_event_id", ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["owner_id"], ["users.id"], name="fk_tasks_owner_id", ondelete="SET NULL"),
        )
    for name, cols in [
        ("ix_tasks_organization_id", ["organization_id"]),
        ("ix_tasks_status", ["status"]),
        ("ix_tasks_priority", ["priority"]),
        ("ix_tasks_due_at", ["due_at"]),
        ("ix_tasks_company_id", ["company_id"]),
        ("ix_tasks_project_id", ["project_id"]),
        ("ix_tasks_activity_id", ["activity_id"]),
        ("ix_tasks_event_id", ["event_id"]),
        ("ix_tasks_owner_id", ["owner_id"]),
    ]:
        if _has_table(bind, "tasks") and not _has_index(bind, "tasks", name):
            op.create_index(name, "tasks", cols)


def downgrade() -> None:
    bind = op.get_bind()
    if _has_table(bind, "tasks"):
        op.drop_table("tasks")
    if _has_table(bind, "activities"):
        for column in ["project_id", "company_id"]:
            if _has_column(bind, "activities", column):
                try:
                    op.drop_column("activities", column)
                except Exception:
                    pass

"""reports_templates_runs_schedules

Revision ID: 20260210_0011
Revises: 20260210_0010
Create Date: 2026-02-10

- Add report templates, generation runs history, and weekly email schedules.
"""

from alembic import op
import sqlalchemy as sa


revision = "20260210_0011"
down_revision = "20260210_0010"
branch_labels = None
depends_on = None


def _has_table(bind, table: str) -> bool:
    insp = sa.inspect(bind)
    return insp.has_table(table)


def upgrade() -> None:
    bind = op.get_bind()

    if not _has_table(bind, "report_templates"):
        op.create_table(
            "report_templates",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("organization_id", sa.Integer(), nullable=True),
            sa.Column("name", sa.String(length=160), nullable=False),
            sa.Column("description", sa.String(length=1024), nullable=True),
            sa.Column("config", sa.JSON(), nullable=True),
            sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        )
        try:
            op.create_index("ix_report_templates_organization_id", "report_templates", ["organization_id"])
        except Exception:
            pass
        try:
            op.create_index("ix_report_templates_created_by", "report_templates", ["created_by"])
        except Exception:
            pass

    if not _has_table(bind, "report_runs"):
        op.create_table(
            "report_runs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("organization_id", sa.Integer(), nullable=True),
            sa.Column("template_id", sa.Integer(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("params", sa.JSON(), nullable=True),
            sa.Column("kpi_snapshot", sa.JSON(), nullable=True),
            sa.Column("html", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=32), nullable=False, server_default="ok"),
            sa.Column("error", sa.String(length=2000), nullable=True),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["template_id"], ["report_templates.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        )
        try:
            op.create_index("ix_report_runs_organization_id", "report_runs", ["organization_id"])
        except Exception:
            pass
        try:
            op.create_index("ix_report_runs_template_id", "report_runs", ["template_id"])
        except Exception:
            pass
        try:
            op.create_index("ix_report_runs_created_by", "report_runs", ["created_by"])
        except Exception:
            pass

    if not _has_table(bind, "report_schedules"):
        op.create_table(
            "report_schedules",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("organization_id", sa.Integer(), nullable=True),
            sa.Column("template_id", sa.Integer(), nullable=True),
            sa.Column("name", sa.String(length=160), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("weekday", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("hour", sa.Integer(), nullable=False, server_default="8"),
            sa.Column("minute", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("timezone", sa.String(length=64), nullable=False, server_default="Europe/Zurich"),
            sa.Column("recipients", sa.JSON(), nullable=True),
            sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["template_id"], ["report_templates.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        )
        try:
            op.create_index("ix_report_schedules_organization_id", "report_schedules", ["organization_id"])
        except Exception:
            pass
        try:
            op.create_index("ix_report_schedules_template_id", "report_schedules", ["template_id"])
        except Exception:
            pass
        try:
            op.create_index("ix_report_schedules_next_run_at", "report_schedules", ["next_run_at"])
        except Exception:
            pass


def downgrade() -> None:
    bind = op.get_bind()
    for t in ["report_schedules", "report_runs", "report_templates"]:
        if _has_table(bind, t):
            try:
                op.drop_table(t)
            except Exception:
                pass


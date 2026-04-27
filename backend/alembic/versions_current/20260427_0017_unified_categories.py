"""unified_categories

Revision ID: 20260427_0017
Revises: 20260221_0016
Create Date: 2026-04-27

- Make organization categories the fixed source of truth (max 5 in API).
- Add category_id FKs to activities, calendar entries and budget targets.
- Backfill category links from legacy text fields.
"""

from __future__ import annotations

from collections import OrderedDict

from alembic import op
import sqlalchemy as sa


revision = "20260427_0017"
down_revision = "20260221_0016"
branch_labels = None
depends_on = None


DEFAULT_CATEGORIES = [
    ("Verkaufsförderung", "#3b82f6"),
    ("Image", "#a78bfa"),
    ("Employer Branding", "#10b981"),
    ("Kundenpflege", "#f59e0b"),
]

ALIASES = {
    "verkaufsfoerderung": "Verkaufsförderung",
    "verkaufsförderung": "Verkaufsförderung",
    "sales": "Verkaufsförderung",
    "image": "Image",
    "branding": "Image",
    "employer_branding": "Employer Branding",
    "employer branding": "Employer Branding",
    "kundenpflege": "Kundenpflege",
}


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


def _norm(value: object) -> str:
    return " ".join(str(value or "").strip().split())


def _canonical(value: object) -> str:
    name = _norm(value)
    if not name:
        return ""
    return ALIASES.get(name.lower(), name)


def _collect_org_ids(bind) -> list[int]:
    orgs = {1}
    for table in ["users", "user_categories", "activities", "calendar_entries", "budget_targets"]:
        if not _has_table(bind, table) or not _has_column(bind, table, "organization_id"):
            continue
        for org_id in bind.execute(sa.text(f"select distinct organization_id from {table} where organization_id is not null")):
            if org_id[0] is not None:
                orgs.add(int(org_id[0]))
    return sorted(orgs)


def _candidate_categories(bind, org_id: int) -> list[tuple[str, str]]:
    out: "OrderedDict[str, tuple[str, str]]" = OrderedDict()

    def add(name: object, color: object = None) -> None:
        canonical = _canonical(name)
        if not canonical:
            return
        key = canonical.lower()
        if key not in out and len(out) < 5:
            out[key] = (canonical, _norm(color) or "#64748b")

    if _has_table(bind, "user_categories"):
        for row in bind.execute(
            sa.text(
                "select name, color from user_categories "
                "where organization_id = :org order by case when user_id is null then 0 else 1 end, position asc, id asc"
            ),
            {"org": org_id},
        ).mappings():
            add(row["name"], row["color"])

    for table, column in [
        ("activities", "category_name"),
        ("calendar_entries", "category"),
        ("budget_targets", "category"),
    ]:
        if not _has_table(bind, table) or not _has_column(bind, table, column):
            continue
        for row in bind.execute(
            sa.text(f"select distinct {column} as name from {table} where organization_id = :org and {column} is not null"),
            {"org": org_id},
        ).mappings():
            add(row["name"])

    for name, color in DEFAULT_CATEGORIES:
        add(name, color)

    return list(out.values())[:5]


def _ensure_org_categories(bind, org_id: int) -> list[tuple[int, str]]:
    rows = list(
        bind.execute(
            sa.text(
                "select id, name from user_categories "
                "where organization_id = :org and user_id is null "
                "order by position asc, id asc"
            ),
            {"org": org_id},
        ).mappings()
    )
    if not rows:
        for idx, (name, color) in enumerate(_candidate_categories(bind, org_id)):
            inserted = bind.execute(
                sa.text(
                    "insert into user_categories (user_id, organization_id, name, color, position, created_at, updated_at) "
                    "values (null, :org, :name, :color, :position, now(), now()) returning id"
                ),
                {"org": org_id, "name": name, "color": color, "position": idx},
            ).scalar()
            rows.append({"id": int(inserted), "name": name})

    # Dedupe and cap org-level categories; references are rewired to the canonical row.
    canonical_by_name: dict[str, int] = {}
    kept: list[tuple[int, str]] = []
    for row in rows:
        row_id = int(row["id"])
        name = _canonical(row["name"])
        key = name.lower()
        if key in canonical_by_name or len(kept) >= 5:
            target = canonical_by_name.get(key) or kept[-1][0]
            for table in ["activities", "calendar_entries", "budget_targets"]:
                if _has_table(bind, table) and _has_column(bind, table, "category_id"):
                    bind.execute(sa.text(f"update {table} set category_id = :target where category_id = :old"), {"target": target, "old": row_id})
            bind.execute(sa.text("delete from user_categories where id = :id"), {"id": row_id})
            continue
        canonical_by_name[key] = row_id
        kept.append((row_id, name))
    return kept


def _backfill_links(bind, org_id: int, categories: list[tuple[int, str]]) -> None:
    aliases_by_name: dict[str, list[str]] = {}
    for name in [c[1] for c in categories]:
        aliases_by_name.setdefault(name, [name])
    for alias, canonical in ALIASES.items():
        aliases_by_name.setdefault(canonical, [canonical]).append(alias)

    for category_id, name in categories:
        for alias in aliases_by_name.get(name, [name]):
            norm = alias.lower()
            if _has_table(bind, "activities") and _has_column(bind, "activities", "category_id"):
                bind.execute(
                    sa.text(
                        "update activities set category_id = :category_id "
                        "where organization_id = :org and category_id is null and lower(trim(category_name)) = :name"
                    ),
                    {"category_id": category_id, "org": org_id, "name": norm},
                )
            if _has_table(bind, "calendar_entries") and _has_column(bind, "calendar_entries", "category_id"):
                bind.execute(
                    sa.text(
                        "update calendar_entries set category_id = :category_id "
                        "where organization_id = :org and category_id is null and lower(trim(category)) = :name"
                    ),
                    {"category_id": category_id, "org": org_id, "name": norm},
                )
            if _has_table(bind, "budget_targets") and _has_column(bind, "budget_targets", "category_id"):
                bind.execute(
                    sa.text(
                        "update budget_targets set category_id = :category_id "
                        "where organization_id = :org and category_id is null and lower(trim(category)) = :name"
                    ),
                    {"category_id": category_id, "org": org_id, "name": norm},
                )


def upgrade() -> None:
    bind = op.get_bind()
    dialect = _dialect(bind)

    for table in ["activities", "calendar_entries", "budget_targets"]:
        if _has_table(bind, table) and not _has_column(bind, table, "category_id"):
            op.add_column(table, sa.Column("category_id", sa.Integer(), nullable=True))
        if _has_table(bind, table) and not _has_index(bind, table, f"ix_{table}_category_id"):
            op.create_index(f"ix_{table}_category_id", table, ["category_id"])
        if dialect == "postgresql" and _has_table(bind, table) and not _has_fk(bind, table, f"fk_{table}_category_id"):
            op.create_foreign_key(
                f"fk_{table}_category_id",
                table,
                "user_categories",
                ["category_id"],
                ["id"],
                ondelete="SET NULL",
            )

    if _has_table(bind, "user_categories"):
        bind.execute(sa.text("update user_categories set organization_id = 1 where organization_id is null"))

    for org_id in _collect_org_ids(bind):
        categories = _ensure_org_categories(bind, org_id)
        _backfill_links(bind, org_id, categories)

    if dialect == "postgresql" and _has_table(bind, "user_categories"):
        if not _has_index(bind, "user_categories", "ux_user_categories_org_name_norm"):
            bind.execute(
                sa.text(
                    "create unique index ux_user_categories_org_name_norm "
                    "on user_categories (organization_id, lower(btrim(name))) "
                    "where user_id is null"
                )
            )
        op.alter_column("user_categories", "organization_id", existing_type=sa.Integer(), nullable=False)


def downgrade() -> None:
    bind = op.get_bind()
    if _has_table(bind, "user_categories") and _has_index(bind, "user_categories", "ux_user_categories_org_name_norm"):
        op.drop_index("ux_user_categories_org_name_norm", table_name="user_categories")

    for table in ["budget_targets", "calendar_entries", "activities"]:
        if _has_table(bind, table) and _has_column(bind, table, "category_id"):
            try:
                op.drop_column(table, "category_id")
            except Exception:
                pass

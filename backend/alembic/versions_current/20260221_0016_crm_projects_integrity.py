"""crm_projects_integrity

Revision ID: 20260221_0016
Revises: 20260220_0015
Create Date: 2026-02-21

- Harden CRM integrity for companies, contacts, projects
- Add deal.owner_id compatibility FK
- Backfill unknown company placeholders and dedupe existing data
"""

from __future__ import annotations

from collections import defaultdict

from alembic import op
import sqlalchemy as sa


revision = "20260221_0016"
down_revision = "20260220_0015"
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
    try:
        return any((idx.get("name") == name) for idx in insp.get_indexes(table))
    except Exception:
        return False


def _has_fk(bind, table: str, name: str) -> bool:
    insp = sa.inspect(bind)
    if not insp.has_table(table):
        return False
    try:
        return any((fk.get("name") == name) for fk in insp.get_foreign_keys(table))
    except Exception:
        return False


def _dialect(bind) -> str:
    try:
        return (bind.dialect.name or "").lower()
    except Exception:
        return ""


def _normalize_name(value: object) -> str | None:
    if value is None:
        return None
    text = " ".join(str(value).strip().split())
    return text or None


def _normalize_email(value: object) -> str | None:
    name = _normalize_name(value)
    return name.lower() if name else None


def _canonical_id(duplicate_map: dict[int, int], row_id: int) -> int:
    current = row_id
    seen: set[int] = set()
    while current in duplicate_map and current not in seen:
        seen.add(current)
        current = duplicate_map[current]
    return current


def _ensure_unknown_company(bind, org_id: int) -> int:
    existing = bind.execute(
        sa.text(
            "select id from companies "
            "where organization_id = :org_id and lower(trim(name)) = 'unknown company' "
            "order by id asc limit 1"
        ),
        {"org_id": org_id},
    ).scalar()
    if existing is not None:
        return int(existing)

    if _dialect(bind) == "postgresql":
        inserted = bind.execute(
            sa.text(
                "insert into companies (organization_id, name, status, created_at, updated_at) "
                "values (:org_id, 'Unknown Company', 'active', now(), now()) "
                "returning id"
            ),
            {"org_id": org_id},
        ).scalar()
        return int(inserted)

    bind.execute(
        sa.text(
            "insert into companies (organization_id, name, status, created_at, updated_at) "
            "values (:org_id, 'Unknown Company', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        ),
        {"org_id": org_id},
    )
    inserted = bind.execute(
        sa.text(
            "select id from companies "
            "where organization_id = :org_id and lower(trim(name)) = 'unknown company' "
            "order by id desc limit 1"
        ),
        {"org_id": org_id},
    ).scalar()
    return int(inserted)


def _normalize_crm_strings(bind) -> None:
    if _has_table(bind, "companies"):
        for row in bind.execute(
            sa.text("select id, name, email, contact_person_email from companies")
        ).mappings():
            bind.execute(
                sa.text(
                    "update companies set name = :name, email = :email, contact_person_email = :contact_person_email where id = :id"
                ),
                {
                    "id": row["id"],
                    "name": _normalize_name(row["name"]),
                    "email": _normalize_email(row["email"]),
                    "contact_person_email": _normalize_email(row["contact_person_email"]),
                },
            )

    if _has_table(bind, "contacts"):
        for row in bind.execute(
            sa.text("select id, name, email from contacts")
        ).mappings():
            bind.execute(
                sa.text("update contacts set name = :name, email = :email where id = :id"),
                {
                    "id": row["id"],
                    "name": _normalize_name(row["name"]),
                    "email": _normalize_email(row["email"]),
                },
            )

    if _has_table(bind, "deals"):
        for row in bind.execute(
            sa.text("select id, title, owner from deals")
        ).mappings():
            bind.execute(
                sa.text("update deals set title = :title, owner = :owner where id = :id"),
                {
                    "id": row["id"],
                    "title": _normalize_name(row["title"]),
                    "owner": _normalize_email(row["owner"]) or _normalize_name(row["owner"]),
                },
            )


def _collect_org_ids(bind) -> list[int]:
    org_ids: set[int] = {1}
    for table in ["users", "companies", "contacts", "deals", "calendar_entries"]:
        if not _has_table(bind, table) or not _has_column(bind, table, "organization_id"):
            continue
        rows = bind.execute(
            sa.text(f"select distinct organization_id from {table} where organization_id is not null")
        ).scalars()
        for value in rows:
            if value is not None:
                org_ids.add(int(value))
    return sorted(org_ids)


def _merge_duplicate_companies(bind) -> None:
    if not _has_table(bind, "companies"):
        return

    rows = list(
        bind.execute(
            sa.text(
                "select id, organization_id, name, email from companies order by organization_id asc, id asc"
            )
        ).mappings()
    )
    duplicate_map: dict[int, int] = {}

    name_groups: dict[tuple[int, str], list[int]] = defaultdict(list)
    email_groups: dict[tuple[int, str], list[int]] = defaultdict(list)
    for row in rows:
        org_id = int(row["organization_id"] or 1)
        norm_name = _normalize_name(row["name"])
        norm_email = _normalize_email(row["email"])
        if norm_name:
            name_groups[(org_id, norm_name.lower())].append(int(row["id"]))
        if norm_email:
            email_groups[(org_id, norm_email)].append(int(row["id"]))

    for groups in (name_groups, email_groups):
        for ids in groups.values():
            canonical = min(_canonical_id(duplicate_map, row_id) for row_id in ids)
            for row_id in ids:
                current = _canonical_id(duplicate_map, row_id)
                if current != canonical:
                    duplicate_map[current] = canonical

    final_pairs: list[tuple[int, int]] = []
    for row in rows:
        row_id = int(row["id"])
        canonical = _canonical_id(duplicate_map, row_id)
        if canonical != row_id:
            final_pairs.append((row_id, canonical))

    for duplicate_id, canonical_id in final_pairs:
        bind.execute(
            sa.text(
                "update companies as target set "
                "email = coalesce(target.email, source.email), "
                "website = coalesce(target.website, source.website), "
                "phone = coalesce(target.phone, source.phone), "
                "address = coalesce(target.address, source.address), "
                "industry = coalesce(target.industry, source.industry), "
                "notes = coalesce(target.notes, source.notes) "
                "from companies as source "
                "where target.id = :canonical_id and source.id = :duplicate_id"
            ),
            {"canonical_id": canonical_id, "duplicate_id": duplicate_id},
        )
        if _has_table(bind, "contacts"):
            bind.execute(
                sa.text("update contacts set company_id = :canonical_id where company_id = :duplicate_id"),
                {"canonical_id": canonical_id, "duplicate_id": duplicate_id},
            )
        if _has_table(bind, "deals"):
            bind.execute(
                sa.text("update deals set company_id = :canonical_id where company_id = :duplicate_id"),
                {"canonical_id": canonical_id, "duplicate_id": duplicate_id},
            )
        if _has_table(bind, "calendar_entries"):
            bind.execute(
                sa.text("update calendar_entries set company_id = :canonical_id where company_id = :duplicate_id"),
                {"canonical_id": canonical_id, "duplicate_id": duplicate_id},
            )
        if _has_table(bind, "content_items"):
            bind.execute(
                sa.text("update content_items set company_id = :canonical_id where company_id = :duplicate_id"),
                {"canonical_id": canonical_id, "duplicate_id": duplicate_id},
            )
        bind.execute(sa.text("delete from companies where id = :duplicate_id"), {"duplicate_id": duplicate_id})


def _merge_duplicate_contacts(bind) -> None:
    if not _has_table(bind, "contacts"):
        return

    rows = list(
        bind.execute(
            sa.text(
                "select id, organization_id, email from contacts "
                "where email is not null order by organization_id asc, id asc"
            )
        ).mappings()
    )
    groups: dict[tuple[int, str], list[int]] = defaultdict(list)
    for row in rows:
        org_id = int(row["organization_id"] or 1)
        norm_email = _normalize_email(row["email"])
        if norm_email:
            groups[(org_id, norm_email)].append(int(row["id"]))

    for ids in groups.values():
        if len(ids) <= 1:
            continue
        canonical_id = min(ids)
        for duplicate_id in sorted(ids):
            if duplicate_id == canonical_id:
                continue
            bind.execute(
                sa.text(
                    "update contacts as target set "
                    "name = coalesce(target.name, source.name), "
                    "phone = coalesce(target.phone, source.phone), "
                    "position = coalesce(target.position, source.position), "
                    "company_id = coalesce(target.company_id, source.company_id) "
                    "from contacts as source "
                    "where target.id = :canonical_id and source.id = :duplicate_id"
                ),
                {"canonical_id": canonical_id, "duplicate_id": duplicate_id},
            )
            if _has_table(bind, "deals"):
                bind.execute(
                    sa.text("update deals set contact_id = :canonical_id where contact_id = :duplicate_id"),
                    {"canonical_id": canonical_id, "duplicate_id": duplicate_id},
                )
            bind.execute(sa.text("delete from contacts where id = :duplicate_id"), {"duplicate_id": duplicate_id})


def upgrade() -> None:
    bind = op.get_bind()
    dialect = _dialect(bind)

    if _has_table(bind, "companies") and _has_column(bind, "companies", "organization_id"):
        bind.execute(sa.text("update companies set organization_id = 1 where organization_id is null"))
    if _has_table(bind, "contacts") and _has_column(bind, "contacts", "organization_id"):
        bind.execute(sa.text("update contacts set organization_id = 1 where organization_id is null"))
    if _has_table(bind, "deals") and _has_column(bind, "deals", "organization_id"):
        bind.execute(sa.text("update deals set organization_id = 1 where organization_id is null"))
    if _has_table(bind, "calendar_entries") and _has_column(bind, "calendar_entries", "organization_id"):
        bind.execute(sa.text("update calendar_entries set organization_id = 1 where organization_id is null"))

    if _has_table(bind, "deals") and not _has_column(bind, "deals", "owner_id"):
        op.add_column("deals", sa.Column("owner_id", sa.Integer(), nullable=True))
    if _has_table(bind, "deals") and not _has_index(bind, "deals", "ix_deals_owner_id"):
        op.create_index("ix_deals_owner_id", "deals", ["owner_id"])
    if (
        dialect == "postgresql"
        and _has_table(bind, "deals")
        and not _has_fk(bind, "deals", "fk_deals_owner_id")
    ):
        op.create_foreign_key(
            "fk_deals_owner_id",
            "deals",
            "users",
            ["owner_id"],
            ["id"],
            ondelete="SET NULL",
        )

    _normalize_crm_strings(bind)

    for org_id in _collect_org_ids(bind):
        unknown_company_id = _ensure_unknown_company(bind, org_id)
        if _has_table(bind, "contacts"):
            bind.execute(
                sa.text(
                    "update contacts set company_id = :company_id "
                    "where organization_id = :org_id and company_id is null"
                ),
                {"company_id": unknown_company_id, "org_id": org_id},
            )

    if _has_table(bind, "deals"):
        if dialect == "postgresql":
            bind.execute(
                sa.text(
                    "update deals as d set company_id = c.company_id "
                    "from contacts as c "
                    "where d.contact_id = c.id and d.company_id is null and c.company_id is not null"
                )
            )
        else:
            for row in bind.execute(
                sa.text(
                    "select d.id as id, c.company_id as company_id "
                    "from deals d join contacts c on c.id = d.contact_id "
                    "where d.company_id is null and c.company_id is not null"
                )
            ).mappings():
                bind.execute(
                    sa.text("update deals set company_id = :company_id where id = :id"),
                    {"company_id": row["company_id"], "id": row["id"]},
                )

    for org_id in _collect_org_ids(bind):
        unknown_company_id = _ensure_unknown_company(bind, org_id)
        if _has_table(bind, "deals"):
            bind.execute(
                sa.text(
                    "update deals set company_id = :company_id "
                    "where organization_id = :org_id and company_id is null"
                ),
                {"company_id": unknown_company_id, "org_id": org_id},
            )

    _merge_duplicate_companies(bind)
    _merge_duplicate_contacts(bind)

    if _has_table(bind, "deals") and _has_table(bind, "users"):
        for row in bind.execute(
            sa.text(
                "select id, organization_id, owner from deals "
                "where owner_id is null and owner is not null"
            )
        ).mappings():
            owner_email = _normalize_email(row["owner"])
            if not owner_email:
                continue
            owner_id = bind.execute(
                sa.text(
                    "select id from users "
                    "where organization_id = :org_id and lower(trim(email)) = :email "
                    "order by id asc limit 1"
                ),
                {"org_id": int(row["organization_id"] or 1), "email": owner_email},
            ).scalar()
            if owner_id is not None:
                bind.execute(
                    sa.text("update deals set owner_id = :owner_id where id = :deal_id"),
                    {"owner_id": owner_id, "deal_id": row["id"]},
                )

    if dialect == "postgresql":
        if not _has_index(bind, "companies", "ux_companies_org_name_norm"):
            bind.execute(
                sa.text(
                    "create unique index ux_companies_org_name_norm "
                    "on companies (organization_id, lower(btrim(name)))"
                )
            )
        if not _has_index(bind, "companies", "ux_companies_org_email_norm"):
            bind.execute(
                sa.text(
                    "create unique index ux_companies_org_email_norm "
                    "on companies (organization_id, lower(btrim(email))) "
                    "where email is not null and btrim(email) <> ''"
                )
            )
        if not _has_index(bind, "contacts", "ux_contacts_org_email_norm"):
            bind.execute(
                sa.text(
                    "create unique index ux_contacts_org_email_norm "
                    "on contacts (organization_id, lower(btrim(email))) "
                    "where email is not null and btrim(email) <> ''"
                )
            )
    else:
        if _has_table(bind, "companies") and not _has_index(bind, "companies", "ux_companies_org_name_norm"):
            op.create_index("ux_companies_org_name_norm", "companies", ["organization_id", "name"], unique=True)
        if _has_table(bind, "companies") and not _has_index(bind, "companies", "ux_companies_org_email_norm"):
            op.create_index("ux_companies_org_email_norm", "companies", ["organization_id", "email"], unique=True)
        if _has_table(bind, "contacts") and not _has_index(bind, "contacts", "ux_contacts_org_email_norm"):
            op.create_index("ux_contacts_org_email_norm", "contacts", ["organization_id", "email"], unique=True)

    if dialect != "sqlite":
        if _has_table(bind, "companies"):
            op.alter_column("companies", "organization_id", existing_type=sa.Integer(), nullable=False)
        if _has_table(bind, "contacts"):
            op.alter_column("contacts", "organization_id", existing_type=sa.Integer(), nullable=False)
            op.alter_column("contacts", "company_id", existing_type=sa.Integer(), nullable=False)
        if _has_table(bind, "deals"):
            op.alter_column("deals", "organization_id", existing_type=sa.Integer(), nullable=False)
            op.alter_column("deals", "company_id", existing_type=sa.Integer(), nullable=False)
        if _has_table(bind, "calendar_entries"):
            op.alter_column("calendar_entries", "organization_id", existing_type=sa.Integer(), nullable=False)


def downgrade() -> None:
    bind = op.get_bind()

    for table, index_name in [
        ("contacts", "ux_contacts_org_email_norm"),
        ("companies", "ux_companies_org_email_norm"),
        ("companies", "ux_companies_org_name_norm"),
        ("deals", "ix_deals_owner_id"),
    ]:
        if _has_table(bind, table) and _has_index(bind, table, index_name):
            try:
                op.drop_index(index_name, table_name=table)
            except Exception:
                pass

    if _has_table(bind, "deals") and _has_column(bind, "deals", "owner_id"):
        try:
            op.drop_column("deals", "owner_id")
        except Exception:
            pass

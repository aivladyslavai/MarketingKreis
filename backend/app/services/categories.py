from __future__ import annotations

from typing import Iterable, Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.user_category import UserCategory


MAX_CATEGORIES = 5

DEFAULT_CATEGORIES: list[dict[str, str]] = [
    {"name": "Verkaufsförderung", "color": "#3b82f6"},
    {"name": "Image", "color": "#a78bfa"},
    {"name": "Employer Branding", "color": "#10b981"},
    {"name": "Kundenpflege", "color": "#f59e0b"},
]

LEGACY_CATEGORY_ALIASES: dict[str, str] = {
    "VERKAUFSFOERDERUNG": "Verkaufsförderung",
    "VERKAUFSFÖRDERUNG": "Verkaufsförderung",
    "SALES": "Verkaufsförderung",
    "IMAGE": "Image",
    "BRANDING": "Image",
    "EMPLOYER_BRANDING": "Employer Branding",
    "EMPLOYER BRANDING": "Employer Branding",
    "KUNDENPFLEGE": "Kundenpflege",
}


def normalize_category_name(value: object) -> str:
    return " ".join(str(value or "").strip().split())


def canonical_category_name(value: object) -> str:
    name = normalize_category_name(value)
    if not name:
        return ""
    return LEGACY_CATEGORY_ALIASES.get(name.upper(), name)


def list_org_categories(db: Session, org_id: int) -> list[UserCategory]:
    return (
        db.query(UserCategory)
        .filter(UserCategory.organization_id == org_id, UserCategory.user_id.is_(None))
        .order_by(UserCategory.position.asc(), UserCategory.id.asc())
        .all()
    )


def validate_category_payload(items: Iterable[object]) -> list[dict[str, object]]:
    cleaned: list[dict[str, object]] = []
    seen: set[str] = set()

    for idx, raw in enumerate(list(items)):
        name = canonical_category_name(getattr(raw, "name", None) if not isinstance(raw, dict) else raw.get("name"))
        color = normalize_category_name(getattr(raw, "color", None) if not isinstance(raw, dict) else raw.get("color"))
        if not name:
            raise HTTPException(status_code=400, detail="Category name is required")
        key = name.lower()
        if key in seen:
            raise HTTPException(status_code=409, detail=f"Duplicate category: {name}")
        seen.add(key)
        cleaned.append({"name": name, "color": color or "#64748b", "position": idx})

    if len(cleaned) > MAX_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_CATEGORIES} categories allowed")
    if not cleaned:
        raise HTTPException(status_code=400, detail="At least one category is required")

    return cleaned


def ensure_default_categories(db: Session, org_id: int) -> list[UserCategory]:
    existing = list_org_categories(db, org_id)
    if existing:
        return existing[:MAX_CATEGORIES]

    items: list[UserCategory] = []
    for idx, item in enumerate(DEFAULT_CATEGORIES):
        cat = UserCategory(
            user_id=None,
            organization_id=org_id,
            name=item["name"],
            color=item["color"],
            position=idx,
        )
        db.add(cat)
        items.append(cat)
    db.flush()
    return items


def find_category_by_name(db: Session, org_id: int, name: str) -> Optional[UserCategory]:
    normalized = canonical_category_name(name)
    if not normalized:
        return None
    return (
        db.query(UserCategory)
        .filter(
            UserCategory.organization_id == org_id,
            UserCategory.user_id.is_(None),
            func.lower(func.trim(UserCategory.name)) == normalized.lower(),
        )
        .order_by(UserCategory.position.asc(), UserCategory.id.asc())
        .first()
    )


def resolve_category(
    db: Session,
    org_id: int,
    *,
    category_id: object = None,
    category_name: object = None,
    required: bool = True,
) -> Optional[UserCategory]:
    ensure_default_categories(db, org_id)

    if category_id not in (None, "", "null"):
        try:
            cid = int(category_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid category_id")
        category = (
            db.query(UserCategory)
            .filter(
                UserCategory.id == cid,
                UserCategory.organization_id == org_id,
                UserCategory.user_id.is_(None),
            )
            .first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        return category

    name = canonical_category_name(category_name)
    if name:
        category = find_category_by_name(db, org_id, name)
        if category:
            return category
        raise HTTPException(status_code=400, detail="Category must be one of the configured categories")

    if not required:
        return None

    categories = list_org_categories(db, org_id)
    if categories:
        return categories[0]
    return ensure_default_categories(db, org_id)[0]

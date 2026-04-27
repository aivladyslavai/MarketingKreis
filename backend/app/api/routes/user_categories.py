from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_current_user, get_org_id, require_writable_user
from app.db.session import get_db_session
from app.models.user import User
from app.models.user_category import UserCategory
from app.schemas.user_category import UserCategoryOut, UserCategoryCreate
from app.services.categories import (
    ensure_default_categories,
    list_org_categories,
    validate_category_payload,
)

router = APIRouter(prefix="/user/categories", tags=["user-categories"])


@router.get("", response_model=List[UserCategoryOut])
def list_user_categories(
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> List[UserCategoryOut]:
    """
    Вернуть категории для текущего пользователя.
    """
    org = get_org_id(user)
    cats = list_org_categories(db, org)
    if not cats:
        cats = ensure_default_categories(db, org)
        db.commit()
    return [UserCategoryOut.model_validate(c) for c in cats]


class SaveCategoriesPayload(BaseModel):
    categories: List[UserCategoryCreate]


@router.put("", response_model=List[UserCategoryOut])
def save_user_categories(
    payload: SaveCategoriesPayload,
    db: Session = Depends(get_db_session),
    user: User = Depends(require_writable_user),
) -> List[UserCategoryOut]:
    """
    Полная замена пользовательских категорий для текущего пользователя.
    """
    org = get_org_id(user)
    cleaned = validate_category_payload(payload.categories)

    db.query(UserCategory).filter(UserCategory.user_id.is_(None), UserCategory.organization_id == org).delete()

    items: List[UserCategory] = []
    for idx, c in enumerate(cleaned):
        item = UserCategory(
            user_id=None,
            name=str(c["name"]),
            color=str(c["color"]),
            position=idx,
            organization_id=org,
        )
        db.add(item)
        items.append(item)

    db.commit()
    for item in items:
        db.refresh(item)

    # Keep FK-backed entities linked after replacing the fixed category set.
    insp = inspect(db.get_bind())
    for table, text_col in [
        ("activities", "category_name"),
        ("calendar_entries", "category"),
        ("budget_targets", "category"),
    ]:
        if not insp.has_table(table):
            continue
        columns = {col["name"] for col in insp.get_columns(table)}
        if "category_id" not in columns or text_col not in columns:
            continue
        for item in items:
            db.execute(
                text(
                    f"update {table} set category_id = :category_id "
                    f"where organization_id = :org and lower(trim({text_col})) = :name"
                ),
                {"category_id": item.id, "org": org, "name": item.name.strip().lower()},
            )
    db.commit()
    return [UserCategoryOut.model_validate(i) for i in items]




from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_current_user, get_org_id, require_writable_user
from app.db.session import get_db_session
from app.models.user import User
from app.models.user_category import UserCategory
from app.schemas.user_category import UserCategoryOut, UserCategoryCreate

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
    cats = (
        db.query(UserCategory)
        .filter(
            (UserCategory.user_id == user.id) | (UserCategory.user_id.is_(None)),
            UserCategory.organization_id == org,
        )
        .order_by(UserCategory.position.asc(), UserCategory.id.asc())
        .all()
    )
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
    # Удаляем старые категории пользователя
    org = get_org_id(user)
    db.query(UserCategory).filter(UserCategory.user_id == user.id, UserCategory.organization_id == org).delete()

    items: List[UserCategory] = []
    for idx, c in enumerate(payload.categories[:5]):
        item = UserCategory(
            user_id=user.id,
            name=c.name.strip(),
            color=c.color.strip(),
            position=idx,
            organization_id=org,
        )
        db.add(item)
        items.append(item)

    db.commit()
    for item in items:
        db.refresh(item)
    return [UserCategoryOut.model_validate(i) for i in items]




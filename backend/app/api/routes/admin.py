from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db_session, require_role, get_current_user
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.activity import Activity
from app.models.calendar import CalendarEntry
from app.models.performance import Performance
from app.core.config import get_settings
from app.api.routes.auth import _hash_password


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/health")
def admin_health(_: User = Depends(require_role(UserRole.admin))) -> Dict[str, str]:
    return {"status": "ok"}


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role(UserRole.admin)),
) -> Dict[str, Any]:
    """Return basic platform metrics for the Admin Dashboard."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    verified_users = db.query(func.count(User.id)).filter(User.is_verified.is_(True)).scalar() or 0
    unverified_users = total_users - verified_users

    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    new_last_7d = (
        db.query(func.count(User.id))
        .filter(User.created_at >= seven_days_ago)
        .scalar()
        or 0
    )

    role_rows: List[tuple] = (
        db.query(User.role, func.count(User.id))
        .group_by(User.role)
        .all()
    )
    roles_breakdown = {str(role.value if hasattr(role, "value") else role): count for role, count in role_rows}

    latest_users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .limit(10)
        .all()
    )
    latest = [
        {
            "id": u.id,
            "email": u.email,
            "role": (u.role.value if hasattr(u.role, "value") else str(u.role)),
            "isVerified": bool(u.is_verified),
            "createdAt": u.created_at.isoformat() if u.created_at else None,
        }
        for u in latest_users
    ]

    return {
        "users": {
            "total": total_users,
            "verified": verified_users,
            "unverified": unverified_users,
            "newLast7d": new_last_7d,
            "roles": roles_breakdown,
            "latest": latest,
        },
        "crm": {
            "companies": db.query(Company).count(),
            "contacts": db.query(Contact).count(),
            "deals": db.query(Deal).count(),
        },
        "activities": {
            "activities": db.query(Activity).count(),
            "calendarEntries": db.query(CalendarEntry).count(),
        },
        "performance": {
            "metrics": db.query(Performance).count(),
        },
    }

@router.post("/bootstrap-me")
def bootstrap_me(
    request: Request,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    One-time bootstrap to grant admin to the current authenticated user.
    Requires header 'x-admin-bootstrap' to match ADMIN_BOOTSTRAP_TOKEN and that there are no admins yet.
    """
    settings = get_settings()
    token_header = request.headers.get("x-admin-bootstrap")
    if not settings or not getattr(settings, "admin_bootstrap_token", None):
        raise HTTPException(status_code=403, detail="Bootstrap disabled")
    if not token_header or token_header != settings.admin_bootstrap_token:
        raise HTTPException(status_code=403, detail="Invalid bootstrap token")

    current_admins = db.query(User).filter(User.role == UserRole.admin).count()
    if current_admins > 0:
        raise HTTPException(status_code=409, detail="Admin already exists")

    user.role = UserRole.admin
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"status": "ok", "id": user.id, "email": user.email, "role": user.role.value if hasattr(user.role, 'value') else str(user.role)}


# === User management ===

class AdminUserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    isVerified: bool
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, description="user | editor | admin")
    is_verified: Optional[bool] = None
    new_password: Optional[str] = Field(None, min_length=6)


class PaginatedUsers(BaseModel):
    items: List[AdminUserOut]
    total: int
    skip: int
    limit: int


@router.get("/users", response_model=PaginatedUsers)
def list_users_admin(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role(UserRole.admin)),
) -> PaginatedUsers:
    """
    Получить список пользователей для админки.
    Поддерживает поиск по email и фильтр по роли.
    """
    q = db.query(User)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(func.lower(User.email).like(like))
    if role:
        try:
            role_enum = UserRole(role)
            q = q.filter(User.role == role_enum)
        except Exception:
            # если пришла некорректная роль — просто игнорируем фильтр
            pass

    total = q.count()
    users = (
        q.order_by(User.created_at.desc())
        .offset(max(skip, 0))
        .limit(max(min(limit, 200), 1))
        .all()
    )
    items: List[AdminUserOut] = []
    for u in users:
        items.append(
            AdminUserOut(
                id=u.id,
                email=u.email,
                role=u.role.value if hasattr(u.role, "value") else str(u.role),
                isVerified=bool(u.is_verified),
                createdAt=u.created_at,
                updatedAt=u.updated_at,
            )
        )
    return PaginatedUsers(items=items, total=total, skip=skip, limit=limit)


@router.get("/users/{user_id}", response_model=AdminUserOut)
def get_user_admin(
    user_id: int,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role(UserRole.admin)),
) -> AdminUserOut:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminUserOut(
        id=user.id,
        email=user.email,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        isVerified=bool(user.is_verified),
        createdAt=user.created_at,
        updatedAt=user.updated_at,
    )


@router.patch("/users/{user_id}", response_model=AdminUserOut)
def update_user_admin(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role(UserRole.admin)),
) -> AdminUserOut:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Обновление email
    if payload.email and payload.email != user.email:
        exists = db.query(User).filter(User.email == payload.email).first()
        if exists and exists.id != user.id:
            raise HTTPException(status_code=409, detail="Email already in use")
        user.email = str(payload.email).lower()

    # Обновление роли
    if payload.role:
        try:
            user.role = UserRole(payload.role)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid role")

    # Обновление флага верификации
    if payload.is_verified is not None:
        user.is_verified = bool(payload.is_verified)

    # Сброс пароля
    if payload.new_password:
        user.hashed_password = _hash_password(payload.new_password)

    db.add(user)
    db.commit()
    db.refresh(user)

    return AdminUserOut(
        id=user.id,
        email=user.email,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        isVerified=bool(user.is_verified),
        createdAt=user.created_at,
        updatedAt=user.updated_at,
    )


@router.delete("/users/{user_id}")
def delete_user_admin(
    user_id: int,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role(UserRole.admin)),
) -> Dict[str, Any]:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"ok": True, "id": user_id}


@router.get("/seed-status")
def seed_status_admin(
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role(UserRole.admin)),
) -> Dict[str, Any]:
    """
    Краткий статус "инициализации" демо-данных.
    Удобно использовать в админ‑UI, чтобы показать, что уже засеяно.
    """
    from app.models.content_task import ContentTask
    from app.models.content_item import ContentAutomationRule, ContentItem, ContentTemplate, Notification

    return {
        "users": {
            "total": db.query(func.count(User.id)).scalar() or 0,
            "admins": db.query(func.count(User.id)).filter(User.role == UserRole.admin).scalar() or 0,
        },
        "crm": {
            "companies": db.query(func.count(Company.id)).scalar() or 0,
            "contacts": db.query(func.count(Contact.id)).scalar() or 0,
            "deals": db.query(func.count(Deal.id)).scalar() or 0,
        },
        "activities": {
            "activities": db.query(func.count(Activity.id)).scalar() or 0,
            "calendarEntries": db.query(func.count(CalendarEntry.id)).scalar() or 0,
        },
        "performance": {
            "metrics": db.query(func.count(Performance.id)).scalar() or 0,
        },
        "content": {
            "items": db.query(func.count(ContentItem.id)).scalar() or 0,
            "tasks": db.query(func.count(ContentTask.id)).scalar() or 0,
            "templates": db.query(func.count(ContentTemplate.id)).scalar() or 0,
            "automationRules": db.query(func.count(ContentAutomationRule.id)).scalar() or 0,
            "notifications": db.query(func.count(Notification.id)).scalar() or 0,
        },
    }


class SeedDemoPayload(BaseModel):
    email: EmailStr = Field(default="demo@marketingkreis.ch")
    password: str = Field(min_length=6, description="Demo account password (admin-only).")
    reset: bool = Field(default=False, description="If true, wipes previous demo dataset before seeding.")


@router.post("/seed-demo")
def seed_demo_admin(
    payload: SeedDemoPayload,
    db: Session = Depends(get_db_session),
    _: User = Depends(require_role(UserRole.admin)),
) -> Dict[str, Any]:
    """
    Create (or refresh) a full demo dataset and a demo account.

    Admin-only because it can create users and demo-tagged CRM rows.
    """
    from app.demo_seed import seed_demo_agency

    try:
        return seed_demo_agency(
            db,
            email=str(payload.email).lower(),
            password=payload.password,
            reset=bool(payload.reset),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db_session, get_current_user, get_org_id, require_role
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.activity import Activity
from app.models.calendar import CalendarEntry
from app.models.performance import Performance
from app.core.config import get_settings
from app.api.routes.auth import _hash_password
from app.models.auth_session import AuthSession, AuthRefreshToken
from app.utils.mailer import send_email


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/health")
def admin_health(_: User = Depends(require_role(UserRole.admin))) -> Dict[str, str]:
    return {"status": "ok"}


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> Dict[str, Any]:
    """Return basic platform metrics for the Admin Dashboard."""
    org = get_org_id(current_user)
    total_users = db.query(func.count(User.id)).filter(User.organization_id == org).scalar() or 0
    verified_users = (
        db.query(func.count(User.id))
        .filter(User.organization_id == org, User.is_verified.is_(True))
        .scalar()
        or 0
    )
    unverified_users = total_users - verified_users

    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    new_last_7d = (
        db.query(func.count(User.id))
        .filter(User.organization_id == org, User.created_at >= seven_days_ago)
        .scalar()
        or 0
    )

    role_rows: List[tuple] = (
        db.query(User.role, func.count(User.id))
        .filter(User.organization_id == org)
        .group_by(User.role)
        .all()
    )
    roles_breakdown = {str(role.value if hasattr(role, "value") else role): count for role, count in role_rows}

    latest_users = (
        db.query(User)
        .filter(User.organization_id == org)
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
            "companies": db.query(Company).filter(Company.organization_id == org).count(),
            "contacts": db.query(Contact).filter(Contact.organization_id == org).count(),
            "deals": db.query(Deal).filter(Deal.organization_id == org).count(),
        },
        "activities": {
            "activities": db.query(Activity).filter(Activity.organization_id == org).count(),
            "calendarEntries": db.query(CalendarEntry).filter(CalendarEntry.organization_id == org).count(),
        },
        "performance": {
            # performance_metrics isn't guaranteed to be tenant-scoped yet; prefer safe default.
            "metrics": (
                db.query(Performance).filter(Performance.organization_id == org).count()  # type: ignore[attr-defined]
                if hasattr(Performance, "organization_id")
                else 0
            ),
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

    org = get_org_id(user)
    current_admins = db.query(User).filter(User.role == UserRole.admin, User.organization_id == org).count()
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
    section_permissions: Optional[Dict[str, bool]] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = Field(None, description="user | editor | admin")
    is_verified: Optional[bool] = None
    new_password: Optional[str] = Field(None, min_length=6)
    section_permissions: Optional[Dict[str, bool]] = None


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
    current_user: User = Depends(require_role(UserRole.admin)),
) -> PaginatedUsers:
    """
    Получить список пользователей для админки.
    Поддерживает поиск по email и фильтр по роли.
    """
    org = get_org_id(current_user)
    q = db.query(User).filter(User.organization_id == org)
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
                section_permissions=getattr(u, "section_permissions", None),
                createdAt=u.created_at,
                updatedAt=u.updated_at,
            )
        )
    return PaginatedUsers(items=items, total=total, skip=skip, limit=limit)


@router.get("/users/{user_id}", response_model=AdminUserOut)
def get_user_admin(
    user_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> AdminUserOut:
    org = get_org_id(current_user)
    user = db.query(User).filter(User.id == user_id, User.organization_id == org).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return AdminUserOut(
        id=user.id,
        email=user.email,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        isVerified=bool(user.is_verified),
        section_permissions=getattr(user, "section_permissions", None),
        createdAt=user.created_at,
        updatedAt=user.updated_at,
    )


@router.patch("/users/{user_id}", response_model=AdminUserOut)
def update_user_admin(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> AdminUserOut:
    org = get_org_id(current_user)
    user = db.query(User).filter(User.id == user_id, User.organization_id == org).first()
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

    # Section permissions (RBAC-lite)
    if payload.section_permissions is not None:
        try:
            user.section_permissions = payload.section_permissions  # type: ignore[attr-defined]
        except Exception:
            # If column is missing (older DB), ignore silently.
            pass

    db.add(user)
    db.commit()
    db.refresh(user)

    return AdminUserOut(
        id=user.id,
        email=user.email,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        isVerified=bool(user.is_verified),
        section_permissions=getattr(user, "section_permissions", None),
        createdAt=user.created_at,
        updatedAt=user.updated_at,
    )


# === Sessions (operations) ===


class AdminSessionOut(BaseModel):
    id: str
    user_id: int
    user_email: EmailStr
    user_role: str
    ip: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    revoked_reason: Optional[str] = None


@router.get("/sessions", response_model=List[AdminSessionOut])
def list_sessions_admin(
    user_id: Optional[int] = None,
    active_only: bool = False,
    limit: int = 200,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> List[AdminSessionOut]:
    org = get_org_id(current_user)
    q = db.query(AuthSession, User).join(User, User.id == AuthSession.user_id).filter(User.organization_id == org)
    if user_id is not None:
        q = q.filter(AuthSession.user_id == int(user_id))
    if active_only:
        q = q.filter(AuthSession.revoked_at.is_(None))
    rows = q.order_by(AuthSession.updated_at.desc()).limit(max(1, min(500, int(limit)))).all()
    out: List[AdminSessionOut] = []
    for s, u in rows:
        out.append(
            AdminSessionOut(
                id=s.id,
                user_id=int(u.id),
                user_email=u.email,
                user_role=(u.role.value if hasattr(u.role, "value") else str(u.role)),
                ip=s.ip,
                user_agent=s.user_agent,
                created_at=s.created_at,
                last_seen_at=s.last_seen_at,
                revoked_at=s.revoked_at,
                revoked_reason=s.revoked_reason,
            )
        )
    return out


@router.post("/sessions/{session_id}/revoke")
def revoke_session_admin(
    session_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> Dict[str, Any]:
    org = get_org_id(current_user)
    sess = (
        db.query(AuthSession)
        .join(User, User.id == AuthSession.user_id)
        .filter(AuthSession.id == session_id, User.organization_id == org)
        .first()
    )
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    if sess.revoked_at is None:
        now = datetime.utcnow()
        sess.revoked_at = now
        sess.revoked_reason = "revoked_by_admin"
        db.add(sess)
        db.query(AuthRefreshToken).filter(AuthRefreshToken.session_id == session_id, AuthRefreshToken.revoked_at.is_(None)).update(
            {"revoked_at": now}, synchronize_session=False
        )
        db.commit()
    return {"ok": True, "id": session_id}


@router.post("/users/{user_id}/revoke_all_sessions")
def revoke_all_sessions_for_user(
    user_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> Dict[str, Any]:
    org = get_org_id(current_user)
    u = db.query(User).filter(User.id == int(user_id), User.organization_id == org).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    now = datetime.utcnow()
    sessions = db.query(AuthSession).filter(AuthSession.user_id == int(user_id), AuthSession.revoked_at.is_(None)).all()
    for s in sessions:
        s.revoked_at = now
        s.revoked_reason = "revoke_all_by_admin"
        db.add(s)
    if sessions:
        sids = [s.id for s in sessions]
        db.query(AuthRefreshToken).filter(AuthRefreshToken.session_id.in_(sids), AuthRefreshToken.revoked_at.is_(None)).update(
            {"revoked_at": now}, synchronize_session=False
        )
    db.commit()
    return {"ok": True, "revoked": len(sessions), "user_id": int(user_id)}


@router.post("/alerts/run/system")
def run_ops_alerts_system(request: Request, db: Session = Depends(get_db_session)) -> Dict[str, Any]:
    """
    Cron-safe ops alerts.
    Auth: header `X-Ops-Token: <OPS_ALERTS_TOKEN>`.

    Minimal: checks DB connectivity. If failing, sends an email to OPS_ALERT_EMAILS.
    """
    settings = get_settings()
    token = (request.headers.get("x-ops-token") or "").strip()
    if not settings.ops_alerts_enabled:
        raise HTTPException(status_code=404, detail="Not found")
    if not settings.ops_alerts_token or token != settings.ops_alerts_token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    recipients = []
    if settings.ops_alert_emails:
        recipients = [e.strip() for e in settings.ops_alert_emails.split(",") if e and e.strip()]

    checks: Dict[str, Any] = {"db": "unknown"}
    ok = True
    err = None
    try:
        db.execute(func.now())  # cheap roundtrip
        checks["db"] = "ok"
    except Exception as e:
        ok = False
        err = str(e)[:500]
        checks["db"] = "error"
        checks["db_error"] = err

    if not ok and recipients and getattr(settings, "smtp_host", None) and getattr(settings, "email_from", None):
        subject = f"[MarketingKreis] ALERT: backend not healthy ({settings.environment})"
        text = f"Backend health check failed.\n\nChecks: {checks}\n"
        for to in recipients:
            try:
                send_email(to=to, subject=subject, text=text)
            except Exception:
                pass

    return {"ok": ok, "checks": checks, "recipients": len(recipients)}


@router.delete("/users/{user_id}")
def delete_user_admin(
    user_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> Dict[str, Any]:
    org = get_org_id(current_user)
    user = db.query(User).filter(User.id == user_id, User.organization_id == org).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"ok": True, "id": user_id}


@router.get("/seed-status")
def seed_status_admin(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.admin)),
) -> Dict[str, Any]:
    """
    Краткий статус "инициализации" демо-данных.
    Удобно использовать в админ‑UI, чтобы показать, что уже засеяно.
    """
    from app.models.content_task import ContentTask
    from app.models.content_item import ContentAutomationRule, ContentItem, ContentTemplate, Notification

    org = get_org_id(current_user)
    perf_metrics = 0
    if hasattr(Performance, "organization_id"):
        try:
            perf_metrics = db.query(func.count(Performance.id)).filter(Performance.organization_id == org).scalar() or 0  # type: ignore[attr-defined]
        except Exception:
            perf_metrics = 0
    return {
        "users": {
            "total": db.query(func.count(User.id)).filter(User.organization_id == org).scalar() or 0,
            "admins": db.query(func.count(User.id)).filter(User.role == UserRole.admin, User.organization_id == org).scalar()
            or 0,
        },
        "crm": {
            "companies": db.query(func.count(Company.id)).filter(Company.organization_id == org).scalar() or 0,
            "contacts": db.query(func.count(Contact.id)).filter(Contact.organization_id == org).scalar() or 0,
            "deals": db.query(func.count(Deal.id)).filter(Deal.organization_id == org).scalar() or 0,
        },
        "activities": {
            "activities": db.query(func.count(Activity.id)).filter(Activity.organization_id == org).scalar() or 0,
            "calendarEntries": db.query(func.count(CalendarEntry.id)).filter(CalendarEntry.organization_id == org).scalar()
            or 0,
        },
        "performance": {
            "metrics": perf_metrics,
        },
        "content": {
            "items": db.query(func.count(ContentItem.id)).filter(ContentItem.organization_id == org).scalar() or 0,
            "tasks": db.query(func.count(ContentTask.id)).filter(ContentTask.organization_id == org).scalar() or 0,
            "templates": db.query(func.count(ContentTemplate.id)).filter(ContentTemplate.organization_id == org).scalar() or 0,
            "automationRules": db.query(func.count(ContentAutomationRule.id)).filter(ContentAutomationRule.organization_id == org).scalar()
            or 0,
            "notifications": db.query(func.count(Notification.id)).filter(Notification.organization_id == org).scalar() or 0,
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
    current_user: User = Depends(require_role(UserRole.admin)),
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
            organization_id=get_org_id(current_user),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


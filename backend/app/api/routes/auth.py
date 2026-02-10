from fastapi import APIRouter, Depends, HTTPException, Response, Request
import json
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from app.db.session import get_db_session
from app.core.config import get_settings
from datetime import timedelta, datetime, timezone
import uuid
import secrets
from jose import jwt
from app.api.deps import get_org_id, require_role
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.auth_session import AuthSession, AuthRefreshToken
import bcrypt
from app.utils.mailer import send_email
from app.core.rate_limit import (
    enforce_rate_limit,
    enforce_bruteforce_protection,
    record_login_failure,
    record_login_success,
    get_client_ip,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _encode_jwt(payload: dict, minutes: int) -> str:
    settings = get_settings()
    now = _utcnow()
    return jwt.encode(
        {
            **payload,
            "iat": int(now.timestamp()),
            "exp": now + timedelta(minutes=minutes),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_access_jwt(user_id: str, session_id: str, minutes: int) -> str:
    return _encode_jwt({"sub": user_id, "sid": session_id, "typ": "access"}, minutes=minutes)


def create_refresh_jwt(user_id: str, session_id: str, jti: str, minutes: int) -> str:
    return _encode_jwt({"sub": user_id, "sid": session_id, "jti": jti, "typ": "refresh"}, minutes=minutes)


def _set_auth_cookies(response: Response, *, access_token: str, refresh_token: str, settings) -> None:
    cookie_domain = settings.cookie_domain
    cookie_secure = settings.cookie_secure
    cookie_samesite = settings.cookie_samesite

    # Double-submit CSRF token (non-HttpOnly so frontend can read it and mirror to header)
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(
        key=getattr(settings, "cookie_csrf_name", "csrf_token"),
        value=csrf_token,
        httponly=False,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path="/",
        domain=cookie_domain,
        max_age=max(settings.refresh_token_expire_minutes * 60, settings.access_token_expire_minutes * 60),
    )

    response.set_cookie(
        key=settings.cookie_access_name,
        value=access_token,
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path="/",
        domain=cookie_domain,
        max_age=settings.access_token_expire_minutes * 60,
    )
    # Refresh token: restrict to /auth to reduce exposure surface
    response.set_cookie(
        key=settings.cookie_refresh_name,
        value=refresh_token,
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path="/auth",
        domain=cookie_domain,
        max_age=settings.refresh_token_expire_minutes * 60,
    )


def _clear_auth_cookies(response: Response, settings) -> None:
    # Access cookie is global
    response.delete_cookie(settings.cookie_access_name, path="/", domain=settings.cookie_domain)
    # Refresh cookie is restricted to /auth, but older deployments used path="/"
    response.delete_cookie(settings.cookie_refresh_name, path="/auth", domain=settings.cookie_domain)
    response.delete_cookie(settings.cookie_refresh_name, path="/", domain=settings.cookie_domain)
    # CSRF cookie is global
    response.delete_cookie(getattr(settings, "cookie_csrf_name", "csrf_token"), path="/", domain=settings.cookie_domain)


@router.post("/login")
async def login(request: Request, response: Response, db: Session = Depends(get_db_session)):
    settings = get_settings()

    # Rate limiting (basic brute-force protection)
    enforce_rate_limit(
        request,
        scope="auth_login_ip",
        limit=int(getattr(settings, "auth_login_rl_ip_per_minute", 20)),
        window_seconds=60,
    )

    # Robust body parsing: accept JSON body regardless of client behavior
    # Accept JSON or form bodies and be lenient with clients
    email = ""
    password = ""
    ctype = (request.headers.get("content-type") or "").lower()
    raw_bytes = await request.body()
    raw_text = raw_bytes.decode("utf-8", errors="ignore").strip() if raw_bytes else ""

    # 1) JSON
    if not email and raw_text:
        if "application/json" in ctype or raw_text.startswith("{"):
            try:
                payload = json.loads(raw_text)
                if isinstance(payload, dict):
                    email = str(payload.get("email") or "").strip()
                    password = str(payload.get("password") or "").strip()
            except Exception:
                pass

    # 2) URL-encoded
    if (not email or not password) and raw_text:
        try:
            from urllib.parse import parse_qs
            parsed = {k: v[0] for k, v in parse_qs(raw_text).items() if v}
            if not email:
                email = str(parsed.get("email") or "").strip()
            if not password:
                password = str(parsed.get("password") or "").strip()
        except Exception:
            pass

    # 3) Query params fallback
    if not email:
        email = str(request.query_params.get("email") or "").strip()
    if not password:
        password = str(request.query_params.get("password") or "").strip()

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    # Normalize email (trim + case-insensitive) to avoid subtle user input issues
    email = email.strip().lower()
    password = password.strip()

    enforce_rate_limit(
        request,
        scope="auth_login_email",
        limit=int(getattr(settings, "auth_login_rl_email_per_minute", 10)),
        window_seconds=60,
        discriminator=email,
    )
    enforce_bruteforce_protection(
        request,
        email=email,
        max_failures=int(getattr(settings, "auth_bruteforce_max_failures", 8)),
        window_seconds=int(getattr(settings, "auth_bruteforce_window_seconds", 15 * 60)),
        lockout_seconds=int(getattr(settings, "auth_bruteforce_lockout_seconds", 15 * 60)),
    )

    # Verify user and password (case-insensitive email match)
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user or not user.hashed_password:
        # No user with this email -> still treat as invalid
        record_login_failure(
            request,
            email=email,
            max_failures=int(getattr(settings, "auth_bruteforce_max_failures", 8)),
            window_seconds=int(getattr(settings, "auth_bruteforce_window_seconds", 15 * 60)),
            lockout_seconds=int(getattr(settings, "auth_bruteforce_lockout_seconds", 15 * 60)),
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Strict password verification using bcrypt.
    # This is required for production; if you ever need a demo‑mode override,
    # implement it via a dedicated environment flag instead of commenting this out.
    try:
        valid = bcrypt.checkpw(password.encode("utf-8"), user.hashed_password.encode("utf-8"))
    except Exception:
        valid = False
    if not valid:
        record_login_failure(
            request,
            email=email,
            max_failures=int(getattr(settings, "auth_bruteforce_max_failures", 8)),
            window_seconds=int(getattr(settings, "auth_bruteforce_window_seconds", 15 * 60)),
            lockout_seconds=int(getattr(settings, "auth_bruteforce_lockout_seconds", 15 * 60)),
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    record_login_success(request, email=email)
    # Email verification check
    # If SKIP_EMAIL_VERIFY=true – do not block logins.
    if not getattr(user, "is_verified", True):
        # In production we enforce verification for all users (including admins).
        if settings.environment == "production":
            raise HTTPException(status_code=403, detail="Email not verified")
        # Non-production may allow skipping verification (dev/testing convenience).
        if not getattr(settings, "skip_email_verify", False) and user.role != UserRole.admin:
            raise HTTPException(status_code=403, detail="Email not verified")

    # Create a server-side session and issue access+refresh tokens (rotation supported)
    now = _utcnow()
    session_id = str(uuid.uuid4())
    refresh_jti = str(uuid.uuid4())

    sess = AuthSession(
        id=session_id,
        user_id=int(user.id),
        ip=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
        last_seen_at=now,
    )
    rt = AuthRefreshToken(
        session_id=session_id,
        token_jti=refresh_jti,
        issued_at=now,
        expires_at=now + timedelta(minutes=settings.refresh_token_expire_minutes),
    )
    db.add(sess)
    db.add(rt)
    db.commit()

    access_token = create_access_jwt(
        user_id=str(user.id),
        session_id=session_id,
        minutes=settings.access_token_expire_minutes,
    )
    refresh_token = create_refresh_jwt(
        user_id=str(user.id),
        session_id=session_id,
        jti=refresh_jti,
        minutes=settings.refresh_token_expire_minutes,
    )
    _set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token, settings=settings)

    # Redirect hint for frontend
    response.headers["X-Redirect-To"] = "/dashboard"
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    return {
        "message": "ok",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": role_value,
            "organization_id": get_org_id(user),
        },
    }


@router.post("/refresh")
def refresh_session(request: Request, response: Response, db: Session = Depends(get_db_session)):
    """
    Rotate refresh token and issue a new access token.
    """
    settings = get_settings()
    enforce_rate_limit(
        request,
        scope="auth_refresh_ip",
        limit=int(getattr(settings, "auth_refresh_rl_ip_per_minute", 60)),
        window_seconds=60,
    )

    raw = request.cookies.get(settings.cookie_refresh_name)
    if not raw:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(raw, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("typ") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = int(payload.get("sub"))
        sid = str(payload.get("sid") or "")
        jti = str(payload.get("jti") or "")
        if not sid or not jti:
            raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception:
        _clear_auth_cookies(response, settings)
        raise HTTPException(status_code=401, detail="Invalid token")

    now = _utcnow()
    session = db.get(AuthSession, sid)
    if not session or session.revoked_at is not None or int(session.user_id) != int(user_id):
        _clear_auth_cookies(response, settings)
        raise HTTPException(status_code=401, detail="Session revoked")

    token_row = (
        db.query(AuthRefreshToken)
        .filter(AuthRefreshToken.session_id == sid, AuthRefreshToken.token_jti == jti)
        .first()
    )

    # Reuse / unknown token -> revoke whole session (possible compromise)
    if not token_row or token_row.revoked_at is not None or token_row.replaced_by_jti:
        session.revoked_at = now
        session.revoked_reason = "refresh_reuse"
        db.add(session)
        db.commit()
        _clear_auth_cookies(response, settings)
        raise HTTPException(status_code=401, detail="Invalid token")

    if token_row.expires_at and token_row.expires_at <= now:
        session.revoked_at = now
        session.revoked_reason = "refresh_expired"
        token_row.revoked_at = now
        db.add(session)
        db.add(token_row)
        db.commit()
        _clear_auth_cookies(response, settings)
        raise HTTPException(status_code=401, detail="Invalid token")

    # Rotate refresh token
    new_jti = str(uuid.uuid4())
    new_row = AuthRefreshToken(
        session_id=sid,
        token_jti=new_jti,
        issued_at=now,
        expires_at=now + timedelta(minutes=settings.refresh_token_expire_minutes),
    )
    token_row.revoked_at = now
    token_row.replaced_by_jti = new_jti
    session.last_seen_at = now
    db.add(new_row)
    db.add(token_row)
    db.add(session)
    db.commit()

    access_token = create_access_jwt(
        user_id=str(user_id),
        session_id=sid,
        minutes=settings.access_token_expire_minutes,
    )
    refresh_token = create_refresh_jwt(
        user_id=str(user_id),
        session_id=sid,
        jti=new_jti,
        minutes=settings.refresh_token_expire_minutes,
    )
    _set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token, settings=settings)
    return {"message": "ok"}


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    name: str | None = None
    token: str | None = None  # invite token when invite_only

def _hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")

def _encode_special(payload: dict, minutes: int) -> str:
    settings = get_settings()
    return jwt.encode(
        {
            **payload,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

def _decode_special(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])

@router.post("/register")
def register(body: RegisterRequest, request: Request, response: Response, db: Session = Depends(get_db_session)):
    settings = get_settings()
    # Normalize email to guarantee case-insensitive uniqueness
    body.email = (body.email or "").strip().lower()

    enforce_rate_limit(
        request,
        scope="auth_register_ip",
        limit=int(getattr(settings, "auth_register_rl_ip_per_hour", 30)),
        window_seconds=60 * 60,
    )
    enforce_rate_limit(
        request,
        scope="auth_register_email",
        limit=int(getattr(settings, "auth_register_rl_ip_per_hour", 30)),
        window_seconds=60 * 60,
        discriminator=body.email,
    )

    # Mode enforcement / invited role
    invited_role = settings.default_role
    invited_org_id: int | None = None
    create_new_org = False
    if settings.signup_mode == "invite_only":
        if not body.token:
            raise HTTPException(status_code=400, detail="Invite token required")
        try:
            data = _decode_special(body.token)
            if data.get("typ") != "invite":
                raise HTTPException(status_code=400, detail="Invalid invite token")
            invited_email = data.get("email")
            invited_role = data.get("role") or settings.default_role
            invited_org_id = int(data.get("org_id") or 0) or None
            if invited_email and invited_email.lower() != body.email.lower():
                raise HTTPException(status_code=400, detail="Invite email mismatch")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid or expired invite token")
    else:
        # signup_mode=open
        if body.token:
            # Optional: allow joining an existing org via invite token even in open mode
            try:
                data = _decode_special(body.token)
                if data.get("typ") == "invite":
                    invited_email = data.get("email")
                    invited_role = data.get("role") or settings.default_role
                    invited_org_id = int(data.get("org_id") or 0) or None
                    if invited_email and invited_email.lower() != body.email.lower():
                        raise HTTPException(status_code=400, detail="Invite email mismatch")
            except HTTPException:
                raise
            except Exception:
                # Ignore malformed token in open mode; treat as self-serve signup
                invited_org_id = None
        if not invited_org_id:
            create_new_org = True

    # Case-insensitive check (Postgres UNIQUE is case-sensitive by default)
    existing = db.query(User).filter(func.lower(User.email) == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    # Determine role:
    # - If this is the VERY FIRST user in the system → always admin (bootstrap)
    # - Otherwise follow invited/default role
    try:
        total_users = db.query(User).count()
    except Exception:
        total_users = 0

    if total_users == 0:
        role = UserRole.admin
    else:
        if create_new_org:
            # First user of a new org must be admin to manage their workspace.
            role = UserRole.admin
        else:
            try:
                role = UserRole(invited_role)
            except Exception:
                role = UserRole.user

    # Organization assignment
    org_id: int | None = None
    if total_users == 0:
        # Bootstrap default org (created by migration/bootstrap); create if missing.
        org = db.query(Organization).filter(Organization.id == 1).first()
        if not org:
            org = Organization(id=1, name="Default")
            db.add(org)
            db.commit()
            db.refresh(org)
        org_id = int(org.id)
    elif create_new_org:
        domain = (body.email.split("@", 1)[1] if "@" in body.email else "").strip().lower()
        name = domain or "Workspace"
        org = Organization(name=name)
        db.add(org)
        db.commit()
        db.refresh(org)
        org_id = int(org.id)
    else:
        if not invited_org_id:
            # Backward-compatible fallback; should not happen for invite flows.
            invited_org_id = 1
        org = db.query(Organization).filter(Organization.id == int(invited_org_id)).first()
        if not org:
            raise HTTPException(status_code=400, detail="Invalid organization")
        org_id = int(org.id)

    user = User(
        email=body.email,
        hashed_password=_hash_password(body.password),
        role=role,
        organization_id=org_id,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        # Protect against race conditions and case variants
        raise HTTPException(status_code=400, detail="User already exists")

    # Optional: skip email verification completely (for demos)
    try:
        if getattr(settings, "skip_email_verify", False):
            user.is_verified = True
            db.add(user)
            db.commit()
            db.refresh(user)
            role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
            return {
                "id": user.id,
                "email": user.email,
                "role": role_value,
                "organization_id": get_org_id(user),
            }
    except Exception:
        # fall through to normal verify flow if anything goes wrong
        pass

    # Generate email verification token
    verify_token = _encode_special({"typ": "verify", "email": user.email}, minutes=60*24*3)
    # Send email if SMTP configured
    verify_link_front = (settings.frontend_url or "").rstrip("/") + f"/verify?token={verify_token}" if settings.frontend_url else None
    subject = "Verify your email"
    text = f"Welcome! Please confirm your email by opening this link: {verify_link_front or ('/verify?token=' + verify_token)}"
    html = f"<p>Welcome!</p><p>Please confirm your email by clicking: <a href=\"{verify_link_front or ('/verify?token=' + verify_token)}\">Verify email</a></p>"
    sent = False
    try:
        sent = send_email(user.email, subject, text, html)
    except Exception:
        sent = False
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    verify_payload: dict = {"sent": sent}
    # Do NOT leak verification tokens in production responses.
    if settings.environment != "production" and settings.debug:
        verify_payload["token"] = verify_token
    return {
        "id": user.id,
        "email": user.email,
        "role": role_value,
        "organization_id": get_org_id(user),
        "verify": verify_payload,
    }

@router.get("/profile")
def profile(request: Request, db: Session = Depends(get_db_session)):
    # import lazily to avoid circular
    from app.api.deps import get_current_user
    user = get_current_user(request, db)
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    return {"id": user.id, "email": user.email, "role": role_value, "organization_id": get_org_id(user)}

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db_session)):
    settings = get_settings()
    # Best-effort: revoke the current session
    sid: str | None = None
    raw_access = request.cookies.get(settings.cookie_access_name)
    if raw_access:
        try:
            payload = jwt.decode(raw_access, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
            if payload.get("typ") == "access":
                sid = str(payload.get("sid") or "") or None
        except Exception:
            sid = None
    if not sid:
        raw_refresh = request.cookies.get(settings.cookie_refresh_name)
        if raw_refresh:
            try:
                payload = jwt.decode(raw_refresh, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
                if payload.get("typ") == "refresh":
                    sid = str(payload.get("sid") or "") or None
            except Exception:
                sid = None

    if sid:
        try:
            sess = db.get(AuthSession, sid)
            if sess and sess.revoked_at is None:
                sess.revoked_at = _utcnow()
                sess.revoked_reason = "logout"
                db.add(sess)
                db.commit()
        except Exception:
            # Do not block logout if DB is unavailable
            pass

    # Clear cookies
    _clear_auth_cookies(response, settings)
    return {"message": "ok"}


class SessionOut(BaseModel):
    id: str
    user_agent: str | None = None
    ip: str | None = None
    created_at: datetime
    last_seen_at: datetime | None = None
    revoked_at: datetime | None = None
    revoked_reason: str | None = None
    is_current: bool = False


def _current_sid_from_access(request: Request, settings) -> str | None:
    raw_access = request.cookies.get(settings.cookie_access_name)
    if not raw_access:
        return None
    try:
        payload = jwt.decode(raw_access, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("typ") != "access":
            return None
        return str(payload.get("sid") or "") or None
    except Exception:
        return None


@router.get("/sessions", response_model=list[SessionOut])
def list_sessions(request: Request, db: Session = Depends(get_db_session)):
    settings = get_settings()
    user = get_current_user(request, db)
    current_sid = _current_sid_from_access(request, settings)
    rows = (
        db.query(AuthSession)
        .filter(AuthSession.user_id == user.id)
        .order_by(AuthSession.created_at.desc())
        .limit(50)
        .all()
    )
    out: list[SessionOut] = []
    for s in rows:
        out.append(
            SessionOut(
                id=str(s.id),
                user_agent=s.user_agent,
                ip=s.ip,
                created_at=s.created_at,
                last_seen_at=s.last_seen_at,
                revoked_at=s.revoked_at,
                revoked_reason=s.revoked_reason,
                is_current=bool(current_sid and str(s.id) == current_sid),
            )
        )
    return out


@router.post("/sessions/{session_id}/revoke")
def revoke_session(session_id: str, request: Request, response: Response, db: Session = Depends(get_db_session)):
    settings = get_settings()
    user = get_current_user(request, db)
    sess = db.get(AuthSession, str(session_id))
    if not sess or int(sess.user_id) != int(user.id):
        raise HTTPException(status_code=404, detail="Session not found")
    if sess.revoked_at is None:
        sess.revoked_at = _utcnow()
        sess.revoked_reason = "user_revoke"
        db.add(sess)
        db.commit()

    # If the current session is revoked, also clear cookies.
    current_sid = _current_sid_from_access(request, settings)
    if current_sid and current_sid == str(session_id):
        _clear_auth_cookies(response, settings)
    return {"ok": True, "id": str(session_id)}


@router.post("/sessions/revoke-all")
def revoke_all_sessions(request: Request, response: Response, db: Session = Depends(get_db_session)):
    settings = get_settings()
    user = get_current_user(request, db)
    now = _utcnow()
    (
        db.query(AuthSession)
        .filter(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
        .update({"revoked_at": now, "revoked_reason": "logout_all"}, synchronize_session=False)
    )
    db.commit()
    _clear_auth_cookies(response, settings)
    return {"ok": True}

class InviteRequest(BaseModel):
    email: str
    role: str | None = None
    expires_minutes: int = 60 * 24 * 7  # 7 days

@router.post("/invite")
def create_invite(
    body: InviteRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    settings = get_settings()
    role = body.role or settings.default_role
    token = _encode_special(
        {"typ": "invite", "email": body.email, "role": role, "org_id": get_org_id(current_user)},
        minutes=body.expires_minutes,
    )
    return {"token": token, "link": f"/signup?token={token}"}

class ResetRequest(BaseModel):
    email: str

class ResetConfirmRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)

@router.post("/request-reset")
def request_reset(body: ResetRequest, request: Request):
    settings = get_settings()
    enforce_rate_limit(
        request,
        scope="auth_reset_request_ip",
        limit=int(getattr(settings, "auth_reset_request_rl_ip_per_hour", 30)),
        window_seconds=60 * 60,
    )
    enforce_rate_limit(
        request,
        scope="auth_reset_request_email",
        limit=int(getattr(settings, "auth_reset_request_rl_email_per_hour", 10)),
        window_seconds=60 * 60,
        discriminator=body.email,
    )
    token = _encode_special({"typ": "reset", "email": body.email}, minutes=60)
    link_front = (settings.frontend_url or "").rstrip("/") + f"/reset?token={token}" if settings.frontend_url else None
    subject = "Password reset"
    text = f"Use the following link to reset your password: {link_front or ('/reset?token=' + token)}"
    html = f"<p>Reset your password:</p><p><a href=\"{link_front or ('/reset?token=' + token)}\">Reset password</a></p>"
    sent = False
    try:
        sent = send_email(body.email, subject, text, html)
    except Exception:
        sent = False
    # Never expose the reset token in API responses in production.
    # For non‑production environments it can optionally be returned to
    # simplify manual testing.
    if settings.environment != "production" and settings.debug:
        return {"token": token, "sent": sent}
    return {"sent": sent}

@router.post("/reset")
def reset_password(body: ResetConfirmRequest, request: Request, db: Session = Depends(get_db_session)):
    settings = get_settings()
    enforce_rate_limit(
        request,
        scope="auth_reset_confirm_ip",
        limit=int(getattr(settings, "auth_reset_confirm_rl_ip_per_hour", 60)),
        window_seconds=60 * 60,
    )
    try:
        data = _decode_special(body.token)
        if data.get("typ") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token")
        email = data.get("email")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    now = _utcnow()
    user.hashed_password = _hash_password(body.new_password)
    db.add(user)

    # Revoke all existing sessions for this user (forces re-login everywhere)
    try:
        sessions = (
            db.query(AuthSession)
            .filter(AuthSession.user_id == int(user.id), AuthSession.revoked_at.is_(None))
            .all()
        )
        for s in sessions:
            s.revoked_at = now
            s.revoked_reason = "password_reset"
            db.add(s)
    except Exception:
        pass
    db.commit()
    return {"message": "password_updated"}

@router.get("/verify")
def verify_email(token: str, request: Request, db: Session = Depends(get_db_session)):
    settings = get_settings()
    enforce_rate_limit(
        request,
        scope="auth_verify_ip",
        limit=int(getattr(settings, "auth_verify_rl_ip_per_hour", 120)),
        window_seconds=60 * 60,
    )
    try:
        data = _decode_special(token)
        if data.get("typ") != "verify":
            raise HTTPException(status_code=400, detail="Invalid token")
        email = data.get("email")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    db.add(user)
    db.commit()
    return {"message": "verified"}



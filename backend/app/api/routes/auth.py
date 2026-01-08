from fastapi import APIRouter, Depends, HTTPException, Response, Request
import json
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db_session
from app.core.config import get_settings
from datetime import timedelta, datetime, timezone
from jose import jwt
from app.models.user import User, UserRole
import bcrypt
from app.utils.mailer import send_email

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


def create_jwt(subject: str, secret: str, algorithm: str, minutes: int) -> str:
    payload = {"sub": subject, "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes)}
    return jwt.encode(payload, secret, algorithm=algorithm)


@router.post("/login")
async def login(request: Request, response: Response, db: Session = Depends(get_db_session)):
    settings = get_settings()

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

    # Verify user and password (case-insensitive email match)
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user or not user.hashed_password:
        # No user with this email -> still treat as invalid
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Strict password verification using bcrypt.
    # This is required for production; if you ever need a demo‑mode override,
    # implement it via a dedicated environment flag instead of commenting this out.
    try:
        valid = bcrypt.checkpw(password.encode("utf-8"), user.hashed_password.encode("utf-8"))
    except Exception:
        valid = False
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Email verification check
    # If SKIP_EMAIL_VERIFY=true – do not block logins.
    # Also never block admin logins to avoid locking yourself out of the system.
    if not getattr(user, "is_verified", True):
        if not getattr(settings, "skip_email_verify", False) and user.role != UserRole.admin:
            raise HTTPException(status_code=403, detail="Email not verified")

    access_token = create_jwt(
        subject=str(user.id),
        secret=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
        minutes=settings.access_token_expire_minutes,
    )
    refresh_token = create_jwt(
        subject=str(user.id),
        secret=settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
        minutes=settings.refresh_token_expire_minutes,
    )

    cookie_domain = settings.cookie_domain
    cookie_secure = settings.cookie_secure
    cookie_samesite = settings.cookie_samesite

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
    response.set_cookie(
        key=settings.cookie_refresh_name,
        value=refresh_token,
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path="/",
        domain=cookie_domain,
        max_age=settings.refresh_token_expire_minutes * 60,
    )

    # Redirect hint for frontend
    response.headers["X-Redirect-To"] = "/dashboard"
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    return {"message": "ok", "user": {"id": user.id, "email": user.email, "role": role_value}}

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
def register(body: RegisterRequest, response: Response, db: Session = Depends(get_db_session)):
    settings = get_settings()
    # Mode enforcement / invited role
    invited_role = settings.default_role
    if settings.signup_mode == "invite_only":
        if not body.token:
            raise HTTPException(status_code=400, detail="Invite token required")
        try:
            data = _decode_special(body.token)
            if data.get("typ") != "invite":
                raise HTTPException(status_code=400, detail="Invalid invite token")
            invited_email = data.get("email")
            invited_role = data.get("role") or settings.default_role
            if invited_email and invited_email.lower() != body.email.lower():
                raise HTTPException(status_code=400, detail="Invite email mismatch")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid or expired invite token")

    existing = db.query(User).filter(User.email == body.email).first()
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
        try:
            role = UserRole(invited_role)
        except Exception:
            role = UserRole.user
    user = User(email=body.email, hashed_password=_hash_password(body.password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)

    # Optional: skip email verification completely (for demos)
    try:
        if getattr(settings, "skip_email_verify", False):
            user.is_verified = True
            db.add(user)
            db.commit()
            db.refresh(user)
            role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
            return {"id": user.id, "email": user.email, "role": role_value}
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
    return {"id": user.id, "email": user.email, "role": role_value, "verify": {"token": verify_token, "sent": sent}}

@router.get("/profile")
def profile(request: Request, db: Session = Depends(get_db_session)):
    # import lazily to avoid circular
    from app.api.deps import get_current_user
    user = get_current_user(request, db)
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    return {"id": user.id, "email": user.email, "role": role_value}

@router.post("/logout")
def logout(response: Response):
    settings = get_settings()
    # Clear cookies
    response.delete_cookie(settings.cookie_access_name, path="/", domain=settings.cookie_domain)
    response.delete_cookie(settings.cookie_refresh_name, path="/", domain=settings.cookie_domain)
    return {"message": "ok"}

class InviteRequest(BaseModel):
    email: str
    role: str | None = None
    expires_minutes: int = 60 * 24 * 7  # 7 days

@router.post("/invite")
def create_invite(body: InviteRequest, request: Request, db: Session = Depends(get_db_session)):
    # Only admins
    from app.api.deps import require_role
    require_role(UserRole.admin)(request, db)  # will raise if not admin
    settings = get_settings()
    role = body.role or settings.default_role
    token = _encode_special({"typ": "invite", "email": body.email, "role": role}, minutes=body.expires_minutes)
    return {"token": token, "link": f"/signup?token={token}"}

class ResetRequest(BaseModel):
    email: str

class ResetConfirmRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)

@router.post("/request-reset")
def request_reset(body: ResetRequest):
    settings = get_settings()
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
def reset_password(body: ResetConfirmRequest, db: Session = Depends(get_db_session)):
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
    user.hashed_password = _hash_password(body.new_password)
    db.add(user)
    db.commit()
    return {"message": "password_updated"}

@router.get("/verify")
def verify_email(token: str, db: Session = Depends(get_db_session)):
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



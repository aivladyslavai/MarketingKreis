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
from typing import Optional
from app.api.deps import get_current_user, get_org_id, require_admin_step_up, require_role
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.auth_session import AuthSession, AuthRefreshToken
import bcrypt
from app.utils.mailer import send_email
from app.utils.crypto import encrypt_text, decrypt_text, hmac_sha256_hex
from app.utils.totp import generate_base32_secret, verify_totp, build_otpauth_uri
from app.core.rate_limit import (
    enforce_rate_limit,
    enforce_bruteforce_protection,
    record_login_failure,
    record_login_success,
    enforce_2fa_bruteforce_protection,
    record_2fa_failure,
    record_2fa_success,
    get_client_ip,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class Login2FARequest(BaseModel):
    challenge_token: str
    code: str


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _get_session_id_from_cookies(request: Request, settings) -> Optional[str]:
    sid: Optional[str] = None
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
    return sid


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

    # CSRF cookie (double-submit). Non-HttpOnly so frontend can mirror into X-CSRF-Token.
    # Only meaningful when cookie-auth is in play.
    csrf_value = secrets.token_urlsafe(32)
    response.set_cookie(
        key=settings.cookie_csrf_name,
        value=csrf_value,
        httponly=False,
        secure=cookie_secure,
        samesite=cookie_samesite,
        path="/",
        domain=cookie_domain,
        max_age=settings.refresh_token_expire_minutes * 60,
    )


def _clear_auth_cookies(response: Response, settings) -> None:
    # Access cookie is global
    response.delete_cookie(settings.cookie_access_name, path="/", domain=settings.cookie_domain)
    # Refresh cookie is restricted to /auth, but older deployments used path="/"
    response.delete_cookie(settings.cookie_refresh_name, path="/auth", domain=settings.cookie_domain)
    response.delete_cookie(settings.cookie_refresh_name, path="/", domain=settings.cookie_domain)
    # CSRF cookie is global, but older deployments may have different path/domain combos.
    response.delete_cookie(settings.cookie_csrf_name, path="/", domain=settings.cookie_domain)
    response.delete_cookie(settings.cookie_csrf_name, path="/auth", domain=settings.cookie_domain)


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

    # Admin 2FA (TOTP) step-up: if enabled, require OTP before issuing cookies.
    if user.role == UserRole.admin and bool(getattr(user, "totp_enabled", False)):
        if not getattr(user, "totp_secret_enc", None):
            raise HTTPException(status_code=500, detail="2FA misconfigured for this user")
        challenge = _encode_special(
            {"typ": "2fa_challenge", "user_id": int(user.id), "nonce": str(uuid.uuid4())},
            minutes=5,
        )
        response.headers["X-2FA-Required"] = "1"
        return {"message": "2fa_required", "challenge_token": challenge}

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


@router.post("/login/2fa")
def login_2fa(body: Login2FARequest, request: Request, response: Response, db: Session = Depends(get_db_session)):
    settings = get_settings()
    # Basic rate limit by IP
    enforce_rate_limit(
        request,
        scope="auth_2fa_ip",
        limit=int(getattr(settings, "auth_2fa_rl_ip_per_minute", 30)),
        window_seconds=60,
    )
    try:
        data = _decode_special(body.challenge_token)
        if data.get("typ") != "2fa_challenge":
            raise HTTPException(status_code=400, detail="Invalid challenge")
        user_id = int(data.get("user_id") or 0)
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid challenge")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired challenge")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.role != UserRole.admin or not bool(getattr(user, "totp_enabled", False)):
        raise HTTPException(status_code=403, detail="2FA not enabled")

    # Additional brute-force protection for 2FA code guessing (separate counters).
    enforce_rate_limit(
        request,
        scope="auth_2fa_user",
        limit=int(getattr(settings, "auth_2fa_rl_user_per_minute", 10)),
        window_seconds=60,
        discriminator=str(user_id),
    )
    enforce_2fa_bruteforce_protection(
        request,
        user_id=int(user_id),
        max_failures=int(getattr(settings, "auth_bruteforce_max_failures", 8)),
        window_seconds=int(getattr(settings, "auth_bruteforce_window_seconds", 15 * 60)),
        lockout_seconds=int(getattr(settings, "auth_bruteforce_lockout_seconds", 15 * 60)),
    )

    secret = decrypt_text(getattr(user, "totp_secret_enc", None))
    if not secret:
        raise HTTPException(status_code=500, detail="2FA misconfigured for this user")

    r = verify_totp(secret, body.code, window=1, last_used_step=getattr(user, "totp_last_used_step", None))
    used_recovery = False
    if not r.ok or r.matched_step is None:
        # Try recovery code
        norm = str(body.code or "").strip().replace(" ", "").replace("-", "")
        digest = hmac_sha256_hex(norm)
        codes = getattr(user, "totp_recovery_codes", None) or []
        new_codes = []
        for item in codes if isinstance(codes, list) else []:
            h = (item or {}).get("hash")
            if h == digest and not (item or {}).get("used_at"):
                new_codes.append({**(item or {}), "used_at": _utcnow().isoformat()})
                used_recovery = True
            else:
                new_codes.append(item)
        if used_recovery:
            user.totp_recovery_codes = new_codes
        else:
            record_2fa_failure(
                request,
                user_id=int(user_id),
                max_failures=int(getattr(settings, "auth_bruteforce_max_failures", 8)),
                window_seconds=int(getattr(settings, "auth_bruteforce_window_seconds", 15 * 60)),
                lockout_seconds=int(getattr(settings, "auth_bruteforce_lockout_seconds", 15 * 60)),
            )
            raise HTTPException(status_code=401, detail="Invalid 2FA code")

    # anti-replay: advance last_used_step
    if not used_recovery:
        user.totp_last_used_step = int(r.matched_step)
    record_2fa_success(request, user_id=int(user_id))
    db.add(user)

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
    # Mark this session as 2FA-verified (admin step-up)
    sess.mfa_verified_at = now
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
    response.headers["X-Redirect-To"] = "/dashboard"
    return {"message": "ok"}


@router.get("/2fa/status")
def totp_status(request: Request, db: Session = Depends(get_db_session)):
    user = get_current_user(request, db)
    return {
        "enabled": bool(getattr(user, "totp_enabled", False)),
        "confirmed_at": getattr(user, "totp_confirmed_at", None),
        "role": (user.role.value if hasattr(user.role, "value") else str(user.role)),
    }


@router.post("/2fa/setup")
def totp_setup(request: Request, db: Session = Depends(get_db_session)):
    user = get_current_user(request, db)
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="2FA setup is restricted to admins")
    secret = generate_base32_secret()
    user.totp_secret_enc = encrypt_text(secret)
    user.totp_enabled = False
    user.totp_confirmed_at = None
    user.totp_last_used_step = None
    db.add(user)
    db.commit()
    uri = build_otpauth_uri(issuer=getattr(get_settings(), "totp_issuer", "MarketingKreis"), account=user.email, secret_b32=secret)
    return {"secret": secret, "otpauth_uri": uri}


class TotpEnableRequest(BaseModel):
    code: str


@router.post("/2fa/enable")
def totp_enable(body: TotpEnableRequest, request: Request, db: Session = Depends(get_db_session)):
    user = get_current_user(request, db)
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="2FA is restricted to admins")
    secret = decrypt_text(getattr(user, "totp_secret_enc", None))
    if not secret:
        raise HTTPException(status_code=400, detail="Run setup first")
    r = verify_totp(secret, body.code, window=1, last_used_step=getattr(user, "totp_last_used_step", None))
    if not r.ok or r.matched_step is None:
        raise HTTPException(status_code=400, detail="Invalid code")
    user.totp_enabled = True
    user.totp_confirmed_at = _utcnow()
    user.totp_last_used_step = int(r.matched_step)
    # Generate recovery codes on first enable if missing.
    existing = getattr(user, "totp_recovery_codes", None)
    recovery_codes: list[str] = []
    if not (isinstance(existing, list) and len(existing) > 0):
        recovery_codes = _generate_recovery_codes(10)
        stored = [{"hash": hmac_sha256_hex(c.replace("-", "")), "used_at": None} for c in recovery_codes]
        user.totp_recovery_codes = stored

    # "2FA as a product": when enabling, revoke other active sessions so no legacy sessions survive.
    settings = get_settings()
    current_sid = _get_session_id_from_cookies(request, settings)
    now = _utcnow()
    revoked_count = 0
    try:
        q = db.query(AuthSession).filter(AuthSession.user_id == int(user.id), AuthSession.revoked_at.is_(None))
        if current_sid:
            q = q.filter(AuthSession.id != current_sid)
        rows = q.all()
        for s in rows:
            s.revoked_at = now
            s.revoked_reason = "2fa_enabled"
            db.add(s)
        session_ids = [s.id for s in rows]
        if session_ids:
            db.query(AuthRefreshToken).filter(
                AuthRefreshToken.session_id.in_(session_ids),
                AuthRefreshToken.revoked_at.is_(None),
            ).update({"revoked_at": now}, synchronize_session=False)
        revoked_count = len(rows)
    except Exception:
        # best-effort; never block enabling 2FA
        revoked_count = 0

    # Mark current session as 2FA-verified too (since the user just entered a valid code).
    try:
        if current_sid:
            sess = db.get(AuthSession, current_sid)
            if sess and sess.revoked_at is None:
                sess.mfa_verified_at = now
                db.add(sess)
    except Exception:
        pass

    db.add(user)
    db.commit()
    return {"ok": True, "enabled": True, "recovery_codes": recovery_codes, "revoked_other_sessions": revoked_count}


class TotpStepUpRequest(BaseModel):
    code: str


@router.post("/2fa/stepup")
def totp_stepup(body: TotpStepUpRequest, request: Request, db: Session = Depends(get_db_session)):
    """
    Step-up endpoint for already authenticated admins.
    Verifies a TOTP/recovery code and marks the current session as 2FA-verified.
    """
    settings = get_settings()
    user = get_current_user(request, db)
    if user.role != UserRole.admin or not bool(getattr(user, "totp_enabled", False)):
        raise HTTPException(status_code=403, detail="2FA not enabled")

    sid = _get_session_id_from_cookies(request, settings)
    if not sid:
        raise HTTPException(status_code=401, detail="Not authenticated")
    sess = db.get(AuthSession, sid)
    if not sess or sess.revoked_at is not None:
        raise HTTPException(status_code=401, detail="Session revoked")

    secret = decrypt_text(getattr(user, "totp_secret_enc", None))
    if not secret:
        raise HTTPException(status_code=500, detail="2FA misconfigured for this user")

    r = verify_totp(secret, body.code, window=1, last_used_step=getattr(user, "totp_last_used_step", None))
    used_recovery = False
    if not r.ok or r.matched_step is None:
        norm = str(body.code or "").strip().replace(" ", "").replace("-", "")
        digest = hmac_sha256_hex(norm)
        codes = getattr(user, "totp_recovery_codes", None) or []
        new_codes = []
        for item in codes if isinstance(codes, list) else []:
            h = (item or {}).get("hash")
            if h == digest and not (item or {}).get("used_at"):
                new_codes.append({**(item or {}), "used_at": _utcnow().isoformat()})
                used_recovery = True
            else:
                new_codes.append(item)
        if used_recovery:
            user.totp_recovery_codes = new_codes
        else:
            raise HTTPException(status_code=401, detail="Invalid 2FA code")

    # anti-replay: advance last_used_step
    if not used_recovery and r.matched_step is not None:
        user.totp_last_used_step = int(r.matched_step)

    sess.mfa_verified_at = _utcnow()
    db.add(user)
    db.add(sess)
    db.commit()
    return {"ok": True, "verified_at": sess.mfa_verified_at}


class TotpDisableRequest(BaseModel):
    code: str


@router.post("/2fa/disable")
def totp_disable(body: TotpDisableRequest, request: Request, db: Session = Depends(get_db_session)):
    user = get_current_user(request, db)
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="2FA is restricted to admins")
    if not bool(getattr(user, "totp_enabled", False)):
        return {"ok": True, "enabled": False}
    secret = decrypt_text(getattr(user, "totp_secret_enc", None))
    if not secret:
        raise HTTPException(status_code=400, detail="2FA misconfigured")
    # Allow disabling via TOTP or a recovery code
    r = verify_totp(secret, body.code, window=1, last_used_step=None)
    if not r.ok:
        # try recovery code
        norm = str(body.code or "").strip().replace(" ", "").replace("-", "")
        digest = hmac_sha256_hex(norm)
        codes = getattr(user, "totp_recovery_codes", None) or []
        used = False
        new_codes = []
        for item in codes if isinstance(codes, list) else []:
            h = (item or {}).get("hash")
            if h == digest and not (item or {}).get("used_at"):
                new_codes.append({**(item or {}), "used_at": _utcnow().isoformat()})
                used = True
            else:
                new_codes.append(item)
        if not used:
            raise HTTPException(status_code=400, detail="Invalid code")
        user.totp_recovery_codes = new_codes
    user.totp_enabled = False
    user.totp_secret_enc = None
    user.totp_confirmed_at = None
    user.totp_last_used_step = None
    user.totp_recovery_codes = None
    db.add(user)
    db.commit()
    return {"ok": True, "enabled": False}


def _generate_recovery_codes(n: int = 10) -> list[str]:
    out: list[str] = []
    for _ in range(n):
        # 10 chars, group for readability
        raw = secrets.token_hex(5)  # 10 hex chars
        out.append(f"{raw[:5]}-{raw[5:]}")
    return out


@router.post("/2fa/recovery/regenerate")
def totp_recovery_regenerate(request: Request, db: Session = Depends(get_db_session)):
    user = get_current_user(request, db)
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="2FA is restricted to admins")
    if not bool(getattr(user, "totp_enabled", False)):
        raise HTTPException(status_code=400, detail="Enable 2FA first")

    codes = _generate_recovery_codes(10)
    stored = [{"hash": hmac_sha256_hex(c.replace("-", "")), "used_at": None} for c in codes]
    user.totp_recovery_codes = stored
    db.add(user)
    db.commit()
    # Return plaintext once (frontend should show+copy and then discard)
    return {"codes": codes, "count": len(codes)}


@router.get("/2fa/recovery/status")
def totp_recovery_status(request: Request, db: Session = Depends(get_db_session)):
    user = get_current_user(request, db)
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="2FA is restricted to admins")
    codes = getattr(user, "totp_recovery_codes", None) or []
    remaining = 0
    if isinstance(codes, list):
        remaining = sum(1 for c in codes if isinstance(c, dict) and not c.get("used_at"))
    return {"enabled": bool(getattr(user, "totp_enabled", False)), "remaining": remaining}


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
    name: Optional[str] = None
    token: Optional[str] = None  # invite token when invite_only

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
    invited_org_id: Optional[int] = None
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
            # Single-tenant convenience: if DEFAULT_ORG_ID is set, attach open signups to that org.
            # Otherwise, create a new workspace per signup (multi-tenant default behavior).
            if getattr(settings, "default_org_id", None):
                try:
                    invited_org_id = int(getattr(settings, "default_org_id") or 0) or None
                except Exception:
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
    org_id: Optional[int] = None
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
    perms = getattr(user, "section_permissions", None)
    return {
        "id": user.id,
        "email": user.email,
        "role": role_value,
        "organization_id": get_org_id(user),
        "section_permissions": perms,
    }

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db_session)):
    settings = get_settings()
    # Best-effort: revoke the current session
    sid = _get_session_id_from_cookies(request, settings)

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


@router.get("/sessions")
def list_sessions(request: Request, db: Session = Depends(get_db_session)):
    """
    List active sessions (devices) for current user.
    """
    settings = get_settings()
    user = get_current_user(request, db)
    current_sid = _get_session_id_from_cookies(request, settings)
    rows = (
        db.query(AuthSession)
        .filter(AuthSession.user_id == int(user.id))
        .order_by(AuthSession.updated_at.desc())
        .limit(200)
        .all()
    )
    return [
        {
            "id": s.id,
            "ip": s.ip,
            "user_agent": s.user_agent,
            "created_at": s.created_at,
            "last_seen_at": s.last_seen_at,
            "revoked_at": s.revoked_at,
            "revoked_reason": s.revoked_reason,
            "is_current": bool(current_sid and s.id == current_sid),
        }
        for s in rows
    ]


@router.post("/sessions/{session_id}/revoke")
def revoke_session(session_id: str, request: Request, response: Response, db: Session = Depends(get_db_session)):
    settings = get_settings()
    user = get_current_user(request, db)
    sess = db.query(AuthSession).filter(AuthSession.id == session_id, AuthSession.user_id == int(user.id)).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    if sess.revoked_at is None:
        sess.revoked_at = _utcnow()
        sess.revoked_reason = "revoked_by_user"
        # revoke all refresh tokens for this session
        db.query(AuthRefreshToken).filter(AuthRefreshToken.session_id == session_id, AuthRefreshToken.revoked_at.is_(None)).update(
            {"revoked_at": _utcnow()}, synchronize_session=False
        )
        db.add(sess)
        db.commit()

    # If this is the current session, clear cookies immediately.
    current_sid = _get_session_id_from_cookies(request, settings)
    if current_sid and current_sid == session_id:
        _clear_auth_cookies(response, settings)
        return {"ok": True, "id": session_id, "logged_out": True}

    return {"ok": True, "id": session_id}


@router.post("/sessions/revoke_all")
def revoke_all_sessions(
    request: Request,
    response: Response,
    keep_current: bool = False,
    db: Session = Depends(get_db_session),
):
    settings = get_settings()
    user = get_current_user(request, db)
    current_sid = _get_session_id_from_cookies(request, settings)

    q = db.query(AuthSession).filter(AuthSession.user_id == int(user.id), AuthSession.revoked_at.is_(None))
    if keep_current and current_sid:
        q = q.filter(AuthSession.id != current_sid)
    rows = q.all()
    now = _utcnow()
    for s in rows:
        s.revoked_at = now
        s.revoked_reason = "revoke_all"
        db.add(s)
    # revoke refresh tokens for affected sessions
    session_ids = [s.id for s in rows]
    if session_ids:
        db.query(AuthRefreshToken).filter(AuthRefreshToken.session_id.in_(session_ids), AuthRefreshToken.revoked_at.is_(None)).update(
            {"revoked_at": now}, synchronize_session=False
        )
    db.commit()

    if not keep_current:
        _clear_auth_cookies(response, settings)
    return {"ok": True, "revoked": len(rows), "keep_current": keep_current}

class InviteRequest(BaseModel):
    email: str
    role: Optional[str] = None
    expires_minutes: int = 60 * 24 * 7  # 7 days

@router.post("/invite")
def create_invite(
    body: InviteRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_admin_step_up()),
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



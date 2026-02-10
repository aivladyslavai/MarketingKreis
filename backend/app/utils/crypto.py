from __future__ import annotations

import base64
import hashlib
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings


def _fernet_key() -> bytes:
    settings = get_settings()
    raw = (getattr(settings, "totp_encryption_key", None) or "").strip()
    if raw:
        return raw.encode("utf-8")
    # Dev fallback: derive a stable Fernet key from CSRF secret
    seed = (settings.csrf_secret_key or settings.jwt_secret_key).encode("utf-8")
    digest = hashlib.sha256(seed).digest()
    return base64.urlsafe_b64encode(digest)


def _hmac_key() -> bytes:
    # Use Fernet key material as HMAC key too (no need for a separate secret).
    return _fernet_key()


def hmac_sha256_hex(message: str) -> str:
    import hmac

    key = _hmac_key()
    msg = (message or "").encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


def encrypt_text(plain: str) -> str:
    f = Fernet(_fernet_key())
    token = f.encrypt((plain or "").encode("utf-8"))
    return token.decode("utf-8")


def decrypt_text(token: Optional[str]) -> str:
    if not token:
        return ""
    f = Fernet(_fernet_key())
    try:
        return f.decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return ""


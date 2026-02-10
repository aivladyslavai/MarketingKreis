from __future__ import annotations

import base64
import hmac
import hashlib
import secrets
import time
from dataclasses import dataclass
from typing import Optional, Tuple


def generate_base32_secret(nbytes: int = 20) -> str:
    # 20 bytes -> 32 base32 chars (good default)
    raw = secrets.token_bytes(nbytes)
    return base64.b32encode(raw).decode("utf-8").replace("=", "")


def _normalize_b32(secret: str) -> bytes:
    s = (secret or "").strip().replace(" ", "").upper()
    if not s:
        return b""
    # add padding
    pad = "=" * ((8 - (len(s) % 8)) % 8)
    return base64.b32decode(s + pad, casefold=True)


def totp_at(secret_b32: str, for_time: int, step_seconds: int = 30, digits: int = 6) -> Tuple[str, int]:
    key = _normalize_b32(secret_b32)
    if not key:
        return ("", 0)
    counter = int(for_time // step_seconds)
    msg = counter.to_bytes(8, "big")
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code_int = (
        ((digest[offset] & 0x7F) << 24)
        | ((digest[offset + 1] & 0xFF) << 16)
        | ((digest[offset + 2] & 0xFF) << 8)
        | (digest[offset + 3] & 0xFF)
    )
    code = str(code_int % (10**digits)).zfill(digits)
    return code, counter


@dataclass
class TotpVerifyResult:
    ok: bool
    matched_step: Optional[int] = None


def verify_totp(
    secret_b32: str,
    code: str,
    *,
    now: Optional[int] = None,
    window: int = 1,
    step_seconds: int = 30,
    digits: int = 6,
    last_used_step: Optional[int] = None,
) -> TotpVerifyResult:
    now = int(now if now is not None else time.time())
    raw = "".join([c for c in str(code or "").strip() if c.isdigit()])
    if len(raw) != digits:
        return TotpVerifyResult(ok=False)

    current_step = int(now // step_seconds)
    for delta in range(-int(window), int(window) + 1):
        t = now + delta * step_seconds
        expected, step = totp_at(secret_b32, t, step_seconds=step_seconds, digits=digits)
        if expected and hmac.compare_digest(expected, raw):
            if last_used_step is not None and step <= int(last_used_step):
                return TotpVerifyResult(ok=False)
            return TotpVerifyResult(ok=True, matched_step=step)
    return TotpVerifyResult(ok=False)


def build_otpauth_uri(*, issuer: str, account: str, secret_b32: str) -> str:
    # minimal RFC/Google Auth compatible URI
    iss = (issuer or "").strip() or "MarketingKreis"
    acc = (account or "").strip()
    label = f"{iss}:{acc}" if acc else iss
    # Keep it simple: SHA1/6/30 defaults
    return f"otpauth://totp/{_url_escape(label)}?secret={_url_escape(secret_b32)}&issuer={_url_escape(iss)}"


def _url_escape(s: str) -> str:
    # avoid importing urllib for tiny helper
    out = []
    for ch in s:
        o = ord(ch)
        if (48 <= o <= 57) or (65 <= o <= 90) or (97 <= o <= 122) or ch in "-_.~:":
            out.append(ch)
        else:
            out.append(f"%{o:02X}")
    return "".join(out)


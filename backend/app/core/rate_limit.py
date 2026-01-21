import hashlib
import threading
import time
from dataclasses import dataclass
from typing import Optional, Tuple

from fastapi import HTTPException, Request

from app.core.config import get_settings

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None  # type: ignore


def get_client_ip(request: Request) -> str:
    """
    Best-effort client IP extraction.

    - In production we are typically behind a proxy (Render/Nginx), so we try X-Forwarded-For.
    - In tests/dev, fall back to request.client.host.
    """
    xff = (request.headers.get("x-forwarded-for") or "").strip()
    if xff:
        # XFF may contain a chain: client, proxy1, proxy2
        return xff.split(",")[0].strip() or "unknown"
    try:
        return (request.client.host or "unknown")  # type: ignore[union-attr]
    except Exception:
        return "unknown"


def _hash(s: str) -> str:
    s = (s or "").strip().lower()
    if not s:
        return "empty"
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:32]


_redis_client: Optional["redis.Redis"] = None
_redis_lock = threading.Lock()


def _get_redis_client() -> Optional["redis.Redis"]:
    """
    Lazily create a Redis client.

    If Redis is not configured or is unreachable, returns None and we fall back
    to in-memory counters (best-effort protection).
    """
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if redis is None:
        return None

    with _redis_lock:
        if _redis_client is not None:
            return _redis_client
        settings = get_settings()
        url = (getattr(settings, "redis_url", None) or "").strip()
        if not url:
            return None
        try:
            client = redis.Redis.from_url(url, decode_responses=True)
            # quick connectivity check
            client.ping()
            _redis_client = client
            return _redis_client
        except Exception:
            # Do not cache failures permanently; redis might appear later.
            return None


@dataclass(frozen=True)
class LimitResult:
    allowed: bool
    retry_after_seconds: int


_mem_lock = threading.Lock()
_mem_counters: dict[str, tuple[float, int]] = {}


def _mem_hit(key: str, limit: int, window_seconds: int) -> LimitResult:
    now = time.time()
    with _mem_lock:
        reset_at, count = _mem_counters.get(key, (now + window_seconds, 0))
        if now >= reset_at:
            reset_at, count = now + window_seconds, 0
        count += 1
        _mem_counters[key] = (reset_at, count)
        allowed = count <= limit
        retry_after = max(0, int(reset_at - now)) if not allowed else 0
        return LimitResult(allowed=allowed, retry_after_seconds=retry_after)


def _redis_hit(key: str, limit: int, window_seconds: int) -> Optional[LimitResult]:
    client = _get_redis_client()
    if client is None:
        return None
    try:
        count = int(client.incr(key))
        if count == 1:
            client.expire(key, int(window_seconds))
        ttl = int(client.ttl(key))
        # ttl can be -1/-2; normalize
        retry_after = max(0, ttl) if count > limit else 0
        return LimitResult(allowed=(count <= limit), retry_after_seconds=retry_after)
    except Exception:
        return None


def hit(key: str, limit: int, window_seconds: int) -> LimitResult:
    """
    Increment a counter in a fixed window and return whether request is allowed.
    Prefers Redis, falls back to in-memory.
    """
    res = _redis_hit(key, limit, window_seconds)
    if res is not None:
        return res
    return _mem_hit(key, limit, window_seconds)


def enforce_rate_limit(
    request: Request,
    *,
    scope: str,
    limit: int,
    window_seconds: int,
    discriminator: str = "",
) -> None:
    """
    Rate limit helper. Raises HTTP 429 when exceeded.
    """
    settings = get_settings()
    # Allow disabling via env/config for debugging.
    if getattr(settings, "auth_rate_limit_enabled", True) is False:
        return

    ip = get_client_ip(request)
    d = _hash(discriminator) if discriminator else ""
    key = f"mk:rl:{scope}:{ip}:{d}"
    res = hit(key, limit, window_seconds)
    if not res.allowed:
        headers = {"Retry-After": str(res.retry_after_seconds)} if res.retry_after_seconds else None
        raise HTTPException(status_code=429, detail="Too many requests", headers=headers)


def enforce_bruteforce_protection(
    request: Request,
    *,
    email: str,
    max_failures: int,
    window_seconds: int,
    lockout_seconds: int,
) -> None:
    """
    Checks if login attempts for (email, ip) are currently locked.
    """
    settings = get_settings()
    if getattr(settings, "auth_rate_limit_enabled", True) is False:
        return

    ip = get_client_ip(request)
    eh = _hash(email)
    lock_key = f"mk:bf:lock:{eh}:{ip}"

    client = _get_redis_client()
    if client is not None:
        try:
            if client.exists(lock_key):
                ttl = int(client.ttl(lock_key))
                headers = {"Retry-After": str(max(0, ttl))} if ttl > 0 else None
                raise HTTPException(status_code=429, detail="Too many login attempts", headers=headers)
            return
        except HTTPException:
            raise
        except Exception:
            # Fall back to memory below.
            pass

    # In-memory lock
    now = time.time()
    with _mem_lock:
        reset_at, _count = _mem_counters.get(lock_key, (0.0, 0))
        if reset_at and now < reset_at:
            retry_after = int(reset_at - now)
            raise HTTPException(status_code=429, detail="Too many login attempts", headers={"Retry-After": str(retry_after)})


def record_login_failure(
    request: Request,
    *,
    email: str,
    max_failures: int,
    window_seconds: int,
    lockout_seconds: int,
) -> None:
    """
    Record a failed login attempt and lock out if threshold reached.
    """
    ip = get_client_ip(request)
    eh = _hash(email)
    fail_key = f"mk:bf:fail:{eh}:{ip}"
    lock_key = f"mk:bf:lock:{eh}:{ip}"

    client = _get_redis_client()
    if client is not None:
        try:
            n = int(client.incr(fail_key))
            if n == 1:
                client.expire(fail_key, int(window_seconds))
            if n >= max_failures:
                # Lock out for lockout_seconds (independent of fail window)
                client.set(lock_key, "1", ex=int(lockout_seconds))
        except Exception:
            pass

    # In-memory (best-effort)
    res = _mem_hit(fail_key, max_failures, window_seconds)
    if not res.allowed:
        with _mem_lock:
            _mem_counters[lock_key] = (time.time() + lockout_seconds, 1)


def record_login_success(request: Request, *, email: str) -> None:
    """
    Clear brute-force counters on successful login.
    """
    ip = get_client_ip(request)
    eh = _hash(email)
    fail_key = f"mk:bf:fail:{eh}:{ip}"
    lock_key = f"mk:bf:lock:{eh}:{ip}"

    client = _get_redis_client()
    if client is not None:
        try:
            client.delete(fail_key, lock_key)
        except Exception:
            pass

    with _mem_lock:
        _mem_counters.pop(fail_key, None)
        _mem_counters.pop(lock_key, None)


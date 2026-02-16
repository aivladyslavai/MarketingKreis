import os
import time
from collections import Counter, deque
from dataclasses import dataclass
from typing import Any, Deque, Dict, List, Optional, Tuple

from app.core.config import get_settings
from app.utils.mailer import send_email


def _parse_recipients(raw: Optional[str]) -> List[str]:
    if not raw:
        return []
    out: List[str] = []
    for part in str(raw).split(","):
        v = part.strip()
        if v:
            out.append(v)
    return out


def _env_int(name: str, default: int) -> int:
    try:
        v = int(str(os.getenv(name, str(default))).strip())
        return v if v > 0 else default
    except Exception:
        return default


@dataclass
class _AlertEvent:
    ts: float
    method: str
    route: str
    path: str
    status_code: int
    request_id: str
    client_ip: Optional[str]
    user_agent: Optional[str]
    detail: Optional[str] = None


_events_5xx: Deque[_AlertEvent] = deque(maxlen=500)
_last_sent_at: float = 0.0


def record_5xx_and_maybe_alert(event: Dict[str, Any]) -> None:
    """
    Minimal аварийность: если 5xx сыпятся пачкой, отправляем email-алерт (если включено).

    Управление через env:
    - OPS_ALERTS_ENABLED=true
    - OPS_ALERT_EMAILS="ops@company.com,dev@company.com"
    - OPS_ALERTS_WINDOW_SECONDS=300
    - OPS_ALERTS_5XX_THRESHOLD=10
    - OPS_ALERTS_COOLDOWN_SECONDS=900
    """
    settings = get_settings()
    if not getattr(settings, "ops_alerts_enabled", False):
        return

    recipients = _parse_recipients(getattr(settings, "ops_alert_emails", None))
    if not recipients:
        return

    now = time.time()
    window_s = _env_int("OPS_ALERTS_WINDOW_SECONDS", 300)
    threshold = _env_int("OPS_ALERTS_5XX_THRESHOLD", 10)
    cooldown_s = _env_int("OPS_ALERTS_COOLDOWN_SECONDS", 900)

    try:
        ev = _AlertEvent(
            ts=now,
            method=str(event.get("method") or ""),
            route=str(event.get("route") or event.get("path") or ""),
            path=str(event.get("path") or ""),
            status_code=int(event.get("status_code") or 500),
            request_id=str(event.get("request_id") or ""),
            client_ip=event.get("client_ip"),
            user_agent=event.get("user_agent"),
            detail=(str(event.get("detail")) if event.get("detail") else None),
        )
    except Exception:
        return

    _events_5xx.append(ev)

    # prune by time window
    cutoff = now - window_s
    while _events_5xx and _events_5xx[0].ts < cutoff:
        _events_5xx.popleft()

    if len(_events_5xx) < threshold:
        return

    global _last_sent_at
    if _last_sent_at and (now - _last_sent_at) < cooldown_s:
        return

    # Build a compact summary for email
    by_route = Counter([e.route or e.path or "-" for e in _events_5xx])
    top_routes = by_route.most_common(5)
    last = list(_events_5xx)[-10:]

    env = getattr(settings, "environment", "unknown")
    release = os.getenv("RENDER_GIT_COMMIT") or os.getenv("GIT_SHA") or ""
    subject = f"[MK] BACKEND 5xx spike: {len(_events_5xx)} in {window_s}s (env={env})"
    if release:
        subject += f" (rev={release[:12]})"

    lines: List[str] = []
    lines.append(f"Environment: {env}")
    if release:
        lines.append(f"Release: {release}")
    lines.append(f"Window: {window_s}s")
    lines.append(f"Count: {len(_events_5xx)} (threshold={threshold})")
    lines.append("")
    lines.append("Top routes:")
    for r, c in top_routes:
        lines.append(f"- {r}: {c}")
    lines.append("")
    lines.append("Last events:")
    for e in last:
        t = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(e.ts))
        extra = f" detail={e.detail}" if e.detail else ""
        lines.append(f"- {t} {e.status_code} {e.method} {e.path} rid={e.request_id}{extra}")

    body = "\n".join(lines)

    any_sent = False
    for to in recipients:
        ok = send_email(to=to, subject=subject, text=body)
        any_sent = any_sent or ok

    # Only set cooldown if we actually had a configured SMTP and sent something
    if any_sent:
        _last_sent_at = now


from email.message import EmailMessage
import smtplib
from typing import Optional
import ssl
import logging
import httpx
from app.core.config import get_settings


logger = logging.getLogger("mk.mailer")


def _mask_email(v: str) -> str:
    try:
        v = (v or "").strip()
        if "@" not in v:
            return "***"
        local, domain = v.split("@", 1)
        if len(local) <= 2:
            return f"{local[0:1]}***@{domain}"
        return f"{local[0:2]}***@{domain}"
    except Exception:
        return "***"


def send_email(to: str, subject: str, text: str, html: Optional[str] = None) -> bool:
    settings = get_settings()

    # Prefer HTTPS email provider if configured (works on hosts that block SMTP egress).
    resend_key = (getattr(settings, "resend_api_key", None) or "").strip()  # type: ignore[attr-defined]
    if resend_key:
        email_from = (settings.email_from or "").strip()
        if not email_from:
            logger.error("resend_missing_email_from to=%s", _mask_email(to))
            return False
        try:
            with httpx.Client(timeout=20.0) as c:
                r = c.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
                    json={
                        "from": email_from,
                        "to": [to],
                        "subject": subject,
                        "text": text,
                        **({"html": html} if html else {}),
                    },
                )
            if 200 <= r.status_code < 300:
                return True
            logger.error(
                "resend_send_failed to=%s status=%s body=%s",
                _mask_email(to),
                r.status_code,
                (r.text or "")[:400],
            )
            return False
        except Exception as e:
            logger.error("resend_send_failed to=%s error=%s", _mask_email(to), repr(e), exc_info=True)
            return False

    host = settings.smtp_host
    port = settings.smtp_port or 587
    user = settings.smtp_user
    password = settings.smtp_pass
    email_from = settings.email_from or user
    if not (host and user and password):
        # SMTP not configured – treat as no-op
        logger.warning(
            "smtp_not_configured to=%s host=%s port=%s user_set=%s pass_set=%s",
            _mask_email(to),
            host or "",
            port,
            bool(user),
            bool(password),
        )
        return False
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = email_from
    msg["To"] = to
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")
    try:
        use_ssl = bool(getattr(settings, "smtp_ssl", False) or int(port) == 465)
        use_starttls = bool(getattr(settings, "smtp_starttls", True)) and not use_ssl
        context = ssl.create_default_context()

        if use_ssl:
            s: smtplib.SMTP = smtplib.SMTP_SSL(host, port, context=context, timeout=20)
        else:
            s = smtplib.SMTP(host, port, timeout=20)

        with s:
            s.ehlo()
            if use_starttls:
                s.starttls(context=context)
                s.ehlo()
            s.login(user, password)
            s.send_message(msg)
        return True
    except Exception as _:
        # Do not leak secrets; log only safe diagnostics.
        logger.error(
            "smtp_send_failed to=%s host=%s port=%s ssl=%s starttls=%s error=%s",
            _mask_email(to),
            host,
            port,
            bool(getattr(settings, "smtp_ssl", False) or int(port) == 465),
            bool(getattr(settings, "smtp_starttls", True) and not (getattr(settings, "smtp_ssl", False) or int(port) == 465)),
            repr(_),
            exc_info=True,
        )
        return False






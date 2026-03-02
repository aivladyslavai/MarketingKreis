from email.message import EmailMessage
import smtplib
from typing import Optional
import ssl
import logging
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






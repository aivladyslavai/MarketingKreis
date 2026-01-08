from email.message import EmailMessage
import smtplib
from typing import Optional
from app.core.config import get_settings


def send_email(to: str, subject: str, text: str, html: Optional[str] = None) -> bool:
    settings = get_settings()
    host = settings.smtp_host
    port = settings.smtp_port or 587
    user = settings.smtp_user
    password = settings.smtp_pass
    email_from = settings.email_from or user
    if not (host and user and password):
        # SMTP not configured – treat as no-op
        return False
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = email_from
    msg["To"] = to
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")
    try:
        with smtplib.SMTP(host, port) as s:
            s.ehlo()
            try:
                s.starttls()
            except Exception:
                pass
            s.login(user, password)
            s.send_message(msg)
        return True
    except Exception as _:
        return False






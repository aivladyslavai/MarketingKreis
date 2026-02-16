import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import Optional, Union
from cryptography.fernet import Fernet


class Settings(BaseSettings):
    """
    Application settings with Pydantic validation.
    Loads from environment variables with type checking and validation.
    """
    app_name: str = Field(default="MarketingKreis CRM", env="APP_NAME")
    environment: str = Field(default="development", env="ENVIRONMENT")

    backend_cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        env="BACKEND_CORS_ORIGINS"
    )
    # Optional regex to allow multiple origins (e.g., all vercel.app subdomains)
    backend_cors_origins_regex: Optional[str] = Field(
        default=None, env="BACKEND_CORS_ORIGINS_REGEX"
    )

    database_url: str = Field(
        default="sqlite:///./app.db",
        env="DATABASE_URL"
    )

    # JWT Authentication - validate non-default
    jwt_secret_key: str = Field(default="dev-secret-key-change-in-production-d8f7g6h5j4k3l2m1n0", env="JWT_SECRET_KEY", min_length=32)
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_minutes: int = Field(default=43200, env="REFRESH_TOKEN_EXPIRE_MINUTES")

    # Cookie settings
    cookie_domain: Optional[str] = Field(default=None, env="COOKIE_DOMAIN")
    cookie_secure: bool = Field(default=False, env="COOKIE_SECURE")
    cookie_samesite: str = Field(default="lax", env="COOKIE_SAMESITE")
    cookie_access_name: str = Field(default="access_token", env="COOKIE_ACCESS_NAME")
    cookie_refresh_name: str = Field(default="refresh_token", env="COOKIE_REFRESH_NAME")
    cookie_csrf_name: str = Field(default="csrf_token", env="COOKIE_CSRF_NAME")

    # Redis / RQ
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    rq_default_queue: str = Field(default="default", env="RQ_DEFAULT_QUEUE")

    # Sentry
    sentry_dsn: Union[str, None] = Field(default=None, env="SENTRY_DSN")
    # If unset, we fall back to ENVIRONMENT (so prod doesn't accidentally report as "development")
    sentry_env: Optional[str] = Field(default=None, env="SENTRY_ENV")

    # Metrics (Prometheus)
    metrics_token: Optional[str] = Field(default=None, env="METRICS_TOKEN")

    # Ops alerts (cron-safe)
    ops_alerts_token: Optional[str] = Field(default=None, env="OPS_ALERTS_TOKEN")
    ops_alerts_enabled: bool = Field(default=False, env="OPS_ALERTS_ENABLED")
    ops_alert_emails: Optional[str] = Field(default=None, env="OPS_ALERT_EMAILS")  # comma-separated recipients

    # CSRF Protection
    csrf_secret_key: str = Field(
        default="dev-csrf-secret-change-in-production-a1b2c3d4e5f6g7h8",
        env="CSRF_SECRET_KEY",
        min_length=32
    )

    # 2FA (TOTP) encryption key (Fernet, urlsafe base64 32-byte key)
    totp_encryption_key: Optional[str] = Field(default=None, env="TOTP_ENCRYPTION_KEY")
    totp_issuer: str = Field(default="MarketingKreis", env="TOTP_ISSUER")

    debug: bool = Field(default=True, env="DEBUG")

    # OpenAI
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o-mini", env="OPENAI_MODEL")

    # Auth & signup
    signup_mode: str = Field(default="invite_only", env="SIGNUP_MODE")  # invite_only | open
    default_role: str = Field(default="user", env="DEFAULT_ROLE")

    # SMTP (optional)
    smtp_host: Optional[str] = Field(default=None, env="SMTP_HOST")
    smtp_port: Optional[int] = Field(default=None, env="SMTP_PORT")
    smtp_user: Optional[str] = Field(default=None, env="SMTP_USER")
    smtp_pass: Optional[str] = Field(default=None, env="SMTP_PASS")
    email_from: Optional[str] = Field(default=None, env="EMAIL_FROM")
    frontend_url: Optional[str] = Field(default=None, env="FRONTEND_URL")
    # Admin bootstrap (optional, use only for first setup)
    admin_bootstrap_token: Optional[str] = Field(default=None, env="ADMIN_BOOTSTRAP_TOKEN")
    # Feature flags
    skip_email_verify: bool = Field(default=False, env="SKIP_EMAIL_VERIFY")
    section_access_enabled: bool = Field(default=True, env="SECTION_ACCESS_ENABLED")

    # Content reminders (cron-safe)
    reminders_cron_token: Optional[str] = Field(default=None, env="REMINDERS_CRON_TOKEN")
    reminders_email_enabled: bool = Field(default=False, env="REMINDERS_EMAIL_ENABLED")

    # Reports scheduling (cron-safe)
    reports_cron_token: Optional[str] = Field(default=None, env="REPORTS_CRON_TOKEN")
    reports_email_enabled: bool = Field(default=False, env="REPORTS_EMAIL_ENABLED")

    # Auth hardening
    auth_rate_limit_enabled: bool = Field(default=True, env="AUTH_RATE_LIMIT_ENABLED")
    # Basic per-endpoint rate limits (production defaults; can be tuned via env)
    auth_login_rl_ip_per_minute: int = Field(default=20, env="AUTH_LOGIN_RL_IP_PER_MINUTE")
    auth_login_rl_email_per_minute: int = Field(default=10, env="AUTH_LOGIN_RL_EMAIL_PER_MINUTE")
    auth_register_rl_ip_per_hour: int = Field(default=30, env="AUTH_REGISTER_RL_IP_PER_HOUR")
    auth_reset_request_rl_ip_per_hour: int = Field(default=30, env="AUTH_RESET_REQUEST_RL_IP_PER_HOUR")
    auth_reset_request_rl_email_per_hour: int = Field(default=10, env="AUTH_RESET_REQUEST_RL_EMAIL_PER_HOUR")
    auth_reset_confirm_rl_ip_per_hour: int = Field(default=60, env="AUTH_RESET_CONFIRM_RL_IP_PER_HOUR")
    auth_verify_rl_ip_per_hour: int = Field(default=120, env="AUTH_VERIFY_RL_IP_PER_HOUR")
    auth_refresh_rl_ip_per_minute: int = Field(default=60, env="AUTH_REFRESH_RL_IP_PER_MINUTE")

    # 2FA (TOTP) step-up rate limits
    auth_2fa_rl_ip_per_minute: int = Field(default=30, env="AUTH_2FA_RL_IP_PER_MINUTE")
    auth_2fa_rl_user_per_minute: int = Field(default=10, env="AUTH_2FA_RL_USER_PER_MINUTE")

    # Brute-force protection (login failures)
    auth_bruteforce_max_failures: int = Field(default=8, env="AUTH_BRUTEFORCE_MAX_FAILURES")
    auth_bruteforce_window_seconds: int = Field(default=15 * 60, env="AUTH_BRUTEFORCE_WINDOW_SECONDS")
    auth_bruteforce_lockout_seconds: int = Field(default=15 * 60, env="AUTH_BRUTEFORCE_LOCKOUT_SECONDS")

    # Demo mode
    # Comma-separated list of demo emails which should be enforced as read-only on mutating endpoints.
    demo_readonly_emails: str = Field(default="demo@marketingkreis.ch", env="DEMO_READONLY_EMAILS")

    # Upload storage (free-tier friendly):
    # Store file bytes in Postgres so uploads survive deploys/restarts.
    upload_store_in_db: bool = Field(default=True, env="UPLOAD_STORE_IN_DB")
    upload_max_bytes: int = Field(default=10 * 1024 * 1024, env="UPLOAD_MAX_BYTES")  # 10MB

    @validator("csrf_secret_key")
    def validate_csrf_secret(cls, v: str, values: dict) -> str:
        """Ensure CSRF secret is strong in production-like envs."""
        env = values.get("environment")
        if env in {"production", "staging"}:
            if len(v) < 32 or "dev-csrf" in v or "change" in v.lower():
                raise ValueError(
                    "CSRF_SECRET_KEY must be a strong, unique secret (min 32 chars) in production. "
                    "Generate with: python3 -c \"import secrets; print(secrets.token_urlsafe(64))\""
                )
        return v

    @validator("totp_encryption_key")
    def validate_totp_encryption_key(cls, v: Optional[str], values: dict) -> Optional[str]:
        env = values.get("environment")
        if env in {"production", "staging"}:
            if not v or len(v.strip()) < 32:
                raise ValueError(
                    "TOTP_ENCRYPTION_KEY must be set in production/staging (Fernet key). "
                    "Generate with: python3 -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
                )
            # Validate it's actually a Fernet key (urlsafe base64 32 bytes)
            try:
                Fernet(v.strip().encode("utf-8"))
            except Exception:
                raise ValueError(
                    "TOTP_ENCRYPTION_KEY is not a valid Fernet key. "
                    "Generate with: python3 -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
                )
        return v.strip() if isinstance(v, str) else v

    @validator("jwt_secret_key")
    def validate_jwt_secret(cls, v: str, values: dict) -> str:
        """Ensure JWT secret is strong in production"""
        env = values.get("environment")
        if env in {"production", "staging"}:
            if len(v) < 32 or "dev-secret" in v or "change" in v.lower():
                raise ValueError(
                    "JWT_SECRET_KEY must be a strong, unique secret (min 32 chars) in production. "
                    "Generate with: python3 -c \"import secrets; print(secrets.token_urlsafe(64))\""
                )
        return v

    @validator("database_url")
    def validate_database_url(cls, v: str, values: dict) -> str:
        """Validate database URL; disallow SQLite in production."""
        env = values.get("environment")
        if env in {"production", "staging"} and v.startswith("sqlite"):
            raise ValueError("SQLite is not allowed for DATABASE_URL in production. Use PostgreSQL.")
        return v

    @validator("debug")
    def validate_debug(cls, v: bool, values: dict) -> bool:
        """Never allow DEBUG=true in production."""
        if values.get("environment") in {"production", "staging"} and v:
            raise ValueError("DEBUG must be false in production.")
        return v

    @validator("skip_email_verify")
    def validate_skip_email_verify(cls, v: bool, values: dict) -> bool:
        """
        Email verification bypass must NEVER be enabled in production.
        """
        if values.get("environment") in {"production", "staging"} and v:
            raise ValueError("SKIP_EMAIL_VERIFY must be false in production.")
        return v

    class Config:
        # Load env file based on ENVIRONMENT; default to development
        _env = (os.getenv("ENVIRONMENT") or "development").strip().lower()
        env_file = (
            ".env.production"
            if _env == "production"
            else (".env.staging" if _env == "staging" else ".env.development")
        )
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Validates all environment variables on first access.
    Raises ValidationError if configuration is invalid.
    """
    return Settings()



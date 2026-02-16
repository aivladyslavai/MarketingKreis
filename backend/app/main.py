from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.tracing import init_tracing
from app.api.routes import activities as activities_routes
from app.api.routes import assistant as assistant_routes
from app.api.routes import auth as auth_routes
from app.api.routes import budget as budget_routes
from app.api.routes import calendar as calendar_routes
from app.api.routes import performance as performance_routes
from app.api.routes import uploads as uploads_routes
from app.api.routes import export as export_routes
from app.api.routes import crm as crm_routes
from app.api.routes import admin as admin_routes
from app.api.routes import health as health_routes
from app.api.routes import metrics as metrics_routes
from app.api.routes import ai as ai_routes
from app.api.routes import imports as imports_routes
from app.api.routes import jobs as jobs_routes
from app.api.routes import user_categories as user_categories_routes
from app.api.routes import content_tasks as content_tasks_routes
from app.api.routes import content_items as content_items_routes
from app.api.routes import reports as reports_routes
from app.db.base import Base
from app.db.session import engine
from app.db.migrations import run_migrations_on_startup
from app.core.security import CSRFMiddleware
from app.core.security_headers import SecurityHeadersMiddleware
from app.core.section_access import SectionAccessMiddleware
import os


def create_app() -> FastAPI:
    app = FastAPI(title="MarketingKreis API")
    settings = get_settings()

    @app.on_event("startup")
    def _startup_migrations() -> None:
        # In production we optionally stamp/upgrade via env flags.
        run_migrations_on_startup()

    # Observability: configure logging + optional error tracing
    init_tracing(app)

    # Trusted hosts (prod hardening)
    if settings.environment in {"production", "staging"}:
        default_hosts = ["marketingkreis.ch", "app.marketingkreis.ch", ".marketingkreis.ch", "localhost", "127.0.0.1"]
        extra_hosts = [h.strip() for h in os.getenv("ALLOWED_HOSTS", ".onrender.com,.vercel.app").split(",") if h.strip()]
        allowed_hosts = list(dict.fromkeys(default_hosts + extra_hosts))
        # If wildcard present, skip TrustedHostMiddleware to avoid 400s from internal health checks
        if "*" not in allowed_hosts:
            app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

    # CORS
    origins = [o.strip() for o in settings.backend_cors_origins.split(',') if o.strip()]
    cors_kwargs = dict(
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # Prefer explicit origins; add regex for vercel if configured
    if origins:
        cors_kwargs["allow_origins"] = origins  # type: ignore
    if getattr(settings, "backend_cors_origins_regex", None):
        cors_kwargs["allow_origin_regex"] = settings.backend_cors_origins_regex  # type: ignore
    app.add_middleware(CORSMiddleware, **cors_kwargs)

    # Centralized security headers (all environments; HSTS only when https)
    app.add_middleware(SecurityHeadersMiddleware)

    # RBAC-lite (per section) enforcement
    if getattr(settings, "section_access_enabled", True):
        app.add_middleware(SectionAccessMiddleware)

    # CSRF middleware (prod-only)
    if settings.environment in {"production", "staging"}:
        app.add_middleware(
            CSRFMiddleware,
            allowed_origins=origins,
            allowed_origin_regex=getattr(settings, "backend_cors_origins_regex", None),
        )

    # Routers
    app.include_router(health_routes.router)
    app.include_router(metrics_routes.router)
    app.include_router(auth_routes.router)
    app.include_router(activities_routes.router)
    app.include_router(calendar_routes.router)
    app.include_router(performance_routes.router)
    app.include_router(budget_routes.router)
    app.include_router(uploads_routes.router)
    app.include_router(export_routes.router)
    app.include_router(imports_routes.router)
    app.include_router(jobs_routes.router)
    app.include_router(user_categories_routes.router)
    app.include_router(content_tasks_routes.router)
    app.include_router(content_items_routes.router)
    app.include_router(reports_routes.router)
    app.include_router(crm_routes.router)
    app.include_router(ai_routes.router)
    app.include_router(assistant_routes.router)
    app.include_router(admin_routes.router)
    
    # Auto-create tables only in non-production for local/dev convenience.
    # In production all schema changes must go through Alembic migrations.
    if settings.environment != "production":
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as e:
            print(f"Warning: Could not create tables: {e}")

    return app


app = create_app()


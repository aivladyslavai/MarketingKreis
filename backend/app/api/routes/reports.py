from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db_session, get_org_id, require_role
from app.core.config import get_settings
from app.models.deal import Deal
from app.models.user import User, UserRole
from app.models.report import ReportRun, ReportSchedule, ReportTemplate
from app.schemas.report import (
    ReportRunCreate,
    ReportRunOut,
    ReportRunOutWithHtml,
    ReportScheduleCreate,
    ReportScheduleOut,
    ReportScheduleUpdate,
    ReportTemplateCreate,
    ReportTemplateOut,
    ReportTemplateUpdate,
)
from app.utils.mailer import send_email


router = APIRouter(prefix="/reports", tags=["reports"])


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _can_manage(user: User) -> bool:
    return user.role in {UserRole.admin, UserRole.editor}


def _norm_emails(emails: List[str]) -> List[str]:
    out: List[str] = []
    seen = set()
    for e in emails or []:
        s = str(e or "").strip().lower()
        if not s or "@" not in s:
            continue
        if s in seen:
            continue
        seen.add(s)
        out.append(s)
    return out


def _compute_next_run_at(*, weekday: int, hour: int, minute: int, now: datetime) -> datetime:
    # weekday: 0=Mon..6=Sun
    base = now.astimezone(timezone.utc).replace(second=0, microsecond=0)
    # convert Python weekday (Mon=0..Sun=6) matches
    days_ahead = (int(weekday) - base.weekday()) % 7
    candidate = base + timedelta(days=days_ahead)
    candidate = candidate.replace(hour=int(hour), minute=int(minute))
    if candidate <= base:
        candidate = candidate + timedelta(days=7)
    return candidate


# --- Templates ---


@router.get("/templates", response_model=List[ReportTemplateOut])
def list_templates(db: Session = Depends(get_db_session), current_user: User = Depends(get_current_user)):
    org = get_org_id(current_user)
    return (
        db.query(ReportTemplate)
        .filter(ReportTemplate.organization_id == org)
        .order_by(ReportTemplate.updated_at.desc())
        .limit(200)
        .all()
    )


@router.post("/templates", response_model=ReportTemplateOut)
def create_template(
    payload: ReportTemplateCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.editor)),
):
    org = get_org_id(current_user)
    tpl = ReportTemplate(
        organization_id=org,
        name=payload.name.strip(),
        description=(payload.description.strip() if payload.description else None),
        config=payload.config or None,
        is_default=bool(payload.is_default),
        created_by=current_user.id,
    )
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.patch("/templates/{template_id}", response_model=ReportTemplateOut)
def update_template(
    template_id: int,
    payload: ReportTemplateUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.editor)),
):
    org = get_org_id(current_user)
    tpl = db.query(ReportTemplate).filter(ReportTemplate.id == template_id, ReportTemplate.organization_id == org).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        tpl.name = str(data["name"]).strip()
    if "description" in data:
        tpl.description = (str(data["description"]).strip() if data["description"] else None)
    if "config" in data:
        tpl.config = data.get("config") or None
    if "is_default" in data and data["is_default"] is not None:
        tpl.is_default = bool(data["is_default"])
    tpl.updated_at = datetime.utcnow()
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.editor)),
):
    org = get_org_id(current_user)
    tpl = db.query(ReportTemplate).filter(ReportTemplate.id == template_id, ReportTemplate.organization_id == org).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(tpl)
    db.commit()
    return {"ok": True, "id": template_id}


# --- Runs (history) ---


@router.get("/runs", response_model=List[ReportRunOut])
def list_runs(
    template_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    org = get_org_id(current_user)
    q = db.query(ReportRun).filter(ReportRun.organization_id == org)
    if template_id is not None:
        q = q.filter(ReportRun.template_id == int(template_id))
    return q.order_by(ReportRun.created_at.desc()).limit(max(1, min(200, int(limit)))).all()


@router.get("/runs/{run_id}", response_model=ReportRunOutWithHtml)
def get_run(
    run_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    org = get_org_id(current_user)
    r = db.query(ReportRun).filter(ReportRun.id == run_id, ReportRun.organization_id == org).first()
    if not r:
        raise HTTPException(status_code=404, detail="Run not found")
    return r


@router.post("/runs", response_model=ReportRunOut)
def create_run(
    payload: ReportRunCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    org = get_org_id(current_user)
    tpl_id = payload.template_id
    if tpl_id is not None:
        exists = db.query(ReportTemplate).filter(ReportTemplate.id == int(tpl_id), ReportTemplate.organization_id == org).first()
        if not exists:
            raise HTTPException(status_code=400, detail="Invalid template_id")
    run = ReportRun(
        organization_id=org,
        template_id=int(tpl_id) if tpl_id is not None else None,
        created_by=current_user.id,
        params=payload.params or None,
        kpi_snapshot=payload.kpi_snapshot or None,
        html=payload.html,
        status=str(payload.status or "ok"),
        error=payload.error,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


# --- Schedules ---


@router.get("/schedules", response_model=List[ReportScheduleOut])
def list_schedules(db: Session = Depends(get_db_session), current_user: User = Depends(require_role(UserRole.editor))):
    org = get_org_id(current_user)
    return (
        db.query(ReportSchedule)
        .filter(ReportSchedule.organization_id == org)
        .order_by(ReportSchedule.updated_at.desc())
        .limit(200)
        .all()
    )


@router.post("/schedules", response_model=ReportScheduleOut)
def create_schedule(
    payload: ReportScheduleCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.editor)),
):
    org = get_org_id(current_user)
    if payload.template_id is not None:
        tpl = db.query(ReportTemplate).filter(ReportTemplate.id == int(payload.template_id), ReportTemplate.organization_id == org).first()
        if not tpl:
            raise HTTPException(status_code=400, detail="Invalid template_id")
    now = _now_utc()
    nxt = _compute_next_run_at(weekday=payload.weekday, hour=payload.hour, minute=payload.minute, now=now)
    row = ReportSchedule(
        organization_id=org,
        template_id=int(payload.template_id) if payload.template_id is not None else None,
        name=payload.name.strip(),
        is_active=bool(payload.is_active),
        weekday=int(payload.weekday),
        hour=int(payload.hour),
        minute=int(payload.minute),
        timezone=str(payload.timezone or "Europe/Zurich"),
        recipients=_norm_emails(payload.recipients),
        next_run_at=nxt,
        created_by=current_user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/schedules/{schedule_id}", response_model=ReportScheduleOut)
def update_schedule(
    schedule_id: int,
    payload: ReportScheduleUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.editor)),
):
    org = get_org_id(current_user)
    row = db.query(ReportSchedule).filter(ReportSchedule.id == schedule_id, ReportSchedule.organization_id == org).first()
    if not row:
        raise HTTPException(status_code=404, detail="Schedule not found")
    data = payload.model_dump(exclude_unset=True)
    if "template_id" in data:
        tid = data.get("template_id")
        if tid is None:
            row.template_id = None
        else:
            tpl = db.query(ReportTemplate).filter(ReportTemplate.id == int(tid), ReportTemplate.organization_id == org).first()
            if not tpl:
                raise HTTPException(status_code=400, detail="Invalid template_id")
            row.template_id = int(tid)
    if "name" in data and data["name"]:
        row.name = str(data["name"]).strip()
    if "is_active" in data and data["is_active"] is not None:
        row.is_active = bool(data["is_active"])
    if "weekday" in data and data["weekday"] is not None:
        row.weekday = int(data["weekday"])
    if "hour" in data and data["hour"] is not None:
        row.hour = int(data["hour"])
    if "minute" in data and data["minute"] is not None:
        row.minute = int(data["minute"])
    if "timezone" in data and data["timezone"]:
        row.timezone = str(data["timezone"])
    if "recipients" in data and data["recipients"] is not None:
        row.recipients = _norm_emails(data.get("recipients") or [])

    # Recompute next run if timing fields were changed
    now = _now_utc()
    row.next_run_at = _compute_next_run_at(weekday=row.weekday, hour=row.hour, minute=row.minute, now=now)
    row.updated_at = datetime.utcnow()
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/schedules/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.editor)),
):
    org = get_org_id(current_user)
    row = db.query(ReportSchedule).filter(ReportSchedule.id == schedule_id, ReportSchedule.organization_id == org).first()
    if not row:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(row)
    db.commit()
    return {"ok": True, "id": schedule_id}


@router.post("/schedules/{schedule_id}/run")
def run_schedule_now(
    schedule_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_role(UserRole.editor)),
):
    """
    Manual runner for a single schedule (UX: "send test now").
    Uses normal auth (no cron token) and therefore works via the /api proxy.
    """
    settings = get_settings()
    org = get_org_id(current_user)
    sch = db.query(ReportSchedule).filter(ReportSchedule.id == schedule_id, ReportSchedule.organization_id == org).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Schedule not found")

    recipients = _norm_emails(sch.recipients or [])
    if not recipients:
        raise HTTPException(status_code=400, detail="Schedule has no recipients")

    # Minimal KPI snapshot (same formulas as /crm/stats)
    deals = db.query(Deal).filter(Deal.organization_id == org).all()
    total_deals = len(deals)
    open_deals = [d for d in deals if (getattr(d, "stage", "") or "").lower() not in ("lost",)]
    won_deals = [d for d in deals if (getattr(d, "stage", "") or "").lower() == "won"]
    pipeline_value = sum(float(getattr(d, "value", 0) or 0) for d in open_deals)
    won_value = sum(float(getattr(d, "value", 0) or 0) for d in won_deals)
    conversion_rate = (len(won_deals) / total_deals * 100.0) if total_deals else 0.0

    kpi = {
        "pipelineValue": pipeline_value,
        "wonValue": won_value,
        "totalDeals": total_deals,
        "conversionRate": conversion_rate,
        "generatedAt": _now_utc().isoformat(),
        "source": "manual_schedule_run",
        "schedule_id": sch.id,
    }

    subject = f"MarketingKreis – Executive Report (test) ({_now_utc().strftime('%Y-%m-%d')})"
    body = (
        "Executive KPIs\n"
        f"- Pipeline: CHF {round(pipeline_value):,}\n"
        f"- Won: CHF {round(won_value):,}\n"
        f"- Deals: {total_deals}\n"
        f"- Conversion: {conversion_rate:.1f}%\n"
    ).replace(",", "'")

    delivery = "disabled"
    emails_sent = 0
    ok = True
    error: Optional[str] = None

    if getattr(settings, "reports_email_enabled", False):
        delivery = "sent"
        for to in recipients:
            try:
                sent_ok = send_email(to=to, subject=subject, text=body)
                if sent_ok:
                    emails_sent += 1
                else:
                    ok = False
            except Exception:
                ok = False
        if not ok:
            error = "email_failed"

    run = ReportRun(
        organization_id=org,
        template_id=sch.template_id,
        created_by=current_user.id,
        params={"schedule_id": sch.id, "type": "manual_test"},
        kpi_snapshot=kpi,
        html=None,
        status="ok" if ok else "error",
        error=error,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    return {
        "ok": ok,
        "schedule_id": sch.id,
        "run_id": run.id,
        "delivery": delivery,
        "emails_sent": emails_sent,
        "recipients": recipients,
        "error": error,
    }


# --- Cron runner (email) ---


@router.post("/schedules/run/system")
def run_schedules_system(request: Request, db: Session = Depends(get_db_session)):
    """
    Cron-safe runner. Authenticate with header `X-Reports-Token: <REPORTS_CRON_TOKEN>`.
    Sends a minimal executive KPI email (no AI) + stores a run record.
    """
    settings = get_settings()
    token = (request.headers.get("x-reports-token") or "").strip()
    if not settings.reports_cron_token or token != settings.reports_cron_token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    now = _now_utc()
    horizon = now + timedelta(minutes=1)
    q = (
        db.query(ReportSchedule)
        .filter(ReportSchedule.is_active.is_(True))
        .filter(ReportSchedule.next_run_at.is_not(None))
        .filter(ReportSchedule.next_run_at <= horizon)
        .order_by(ReportSchedule.next_run_at.asc())
        .limit(200)
    )
    rows = q.all()
    sent = 0

    for sch in rows:
        org = sch.organization_id
        if not org:
            continue

        recipients = _norm_emails(sch.recipients or [])
        if not recipients:
            # still advance schedule
            sch.last_run_at = now
            sch.next_run_at = _compute_next_run_at(weekday=sch.weekday, hour=sch.hour, minute=sch.minute, now=now + timedelta(seconds=5))
            db.add(sch)
            continue

        # Minimal KPI snapshot (same formulas as /crm/stats)
        deals = db.query(Deal).filter(Deal.organization_id == org).all()
        total_deals = len(deals)
        open_deals = [d for d in deals if (getattr(d, "stage", "") or "").lower() not in ("lost",)]
        won_deals = [d for d in deals if (getattr(d, "stage", "") or "").lower() == "won"]
        pipeline_value = sum(float(getattr(d, "value", 0) or 0) for d in open_deals)
        won_value = sum(float(getattr(d, "value", 0) or 0) for d in won_deals)
        conversion_rate = (len(won_deals) / total_deals * 100.0) if total_deals else 0.0

        kpi = {
            "pipelineValue": pipeline_value,
            "wonValue": won_value,
            "totalDeals": total_deals,
            "conversionRate": conversion_rate,
        }

        subject = f"MarketingKreis – Weekly Executive Report ({now.strftime('%Y-%m-%d')})"
        body = (
            "Executive KPIs\n"
            f"- Pipeline: CHF {round(pipeline_value):,}\n"
            f"- Won: CHF {round(won_value):,}\n"
            f"- Deals: {total_deals}\n"
            f"- Conversion: {conversion_rate:.1f}%\n"
        ).replace(",", "'")

        ok = True
        if getattr(settings, "reports_email_enabled", False):
            for to in recipients:
                try:
                    send_email(to=to, subject=subject, text=body)
                    sent += 1
                except Exception:
                    ok = False

        db.add(
            ReportRun(
                organization_id=org,
                template_id=sch.template_id,
                created_by=sch.created_by,
                params={"schedule_id": sch.id, "type": "weekly"},
                kpi_snapshot=kpi,
                html=None,
                status="ok" if ok else "error",
                error=None if ok else "email_failed",
            )
        )

        sch.last_run_at = now
        sch.next_run_at = _compute_next_run_at(weekday=sch.weekday, hour=sch.hour, minute=sch.minute, now=now + timedelta(seconds=5))
        db.add(sch)

    db.commit()
    return {"ok": True, "due": len(rows), "emails_sent": sent}


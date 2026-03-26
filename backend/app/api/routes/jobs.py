import csv
import io
import json

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.models.job import Job
from app.api.deps import get_current_user, get_org_id

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
def list_jobs(
    db: Session = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    org = get_org_id(current_user)
    jobs = db.query(Job).filter(Job.organization_id == org).order_by(Job.created_at.desc()).limit(50).all()
    return {
        "items": [
            {
                "id": str(j.id),
                "type": j.type,
                "status": "completed" if j.status in ("finished", "completed") else j.status,
                "phase": getattr(j, "phase", None),
                "progress": getattr(j, "progress", None),
                "upload_id": getattr(j, "upload_id", None),
                "created_at": j.created_at,
            }
            for j in jobs
        ]
    }


@router.get("/{job_id}")
def get_job(
    job_id: int,
    db: Session = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    org = get_org_id(current_user)
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == org).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    result = None
    if job.result:
        try:
            result = json.loads(job.result)
        except Exception:
            result = {"raw": job.result}
    return {
        "id": str(job.id),
        "type": job.type,
        "status": "completed" if job.status in ("finished", "completed") else job.status,
        "phase": getattr(job, "phase", None),
        "progress": getattr(job, "progress", None),
        "upload_id": getattr(job, "upload_id", None),
        "cancelled_at": getattr(job, "cancelled_at", None),
        "result": result,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
    }


@router.post("/{job_id}/cancel")
def cancel_job(
    job_id: int,
    db: Session = Depends(get_db_session),
    current_user=Depends(get_current_user),
):
    """Request cancellation of a running import job. The worker checks cancelled_at before each chunk."""
    org = get_org_id(current_user)
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == org).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status not in ("queued", "processing", "started"):
        return {"ok": True, "status": job.status, "message": "Job already finished or cancelled"}
    job.cancelled_at = datetime.now(timezone.utc)
    job.status = "cancelled"
    db.commit()
    return {"ok": True, "status": "cancelled"}


@router.get("/{job_id}/errors.csv")
def download_job_errors_csv(
    job_id: int,
    db: Session = Depends(get_db_session),
    current_user=Depends(get_current_user),
) -> Response:
    """Download row-level import errors as CSV (row, message, source, raw columns)."""
    org = get_org_id(current_user)
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == org).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    errors = []
    if job.result:
        try:
            data = json.loads(job.result)
            errors = data.get("row_errors") or []
        except Exception:
            pass
    if not errors:
        # Return minimal CSV with headers only
        content = "row,message,source\n"
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="import-errors-{job_id}.csv"'},
        )
    # Build CSV: row, message, source, then dynamic raw keys
    all_raw_keys = set()
    for e in errors:
        all_raw_keys.update((e.get("raw") or {}).keys())
    raw_keys = sorted(all_raw_keys)[:20]
    headers = ["row", "message", "source"] + [f"raw_{k}" for k in raw_keys]
    rows = []
    for e in errors:
        raw = e.get("raw") or {}
        row = [
            str(e.get("row", "")),
            str(e.get("message", ""))[:500],
            str(e.get("source", "")),
        ]
        for k in raw_keys:
            row.append(str(raw.get(k, ""))[:200])
        rows.append(row)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(headers)
    w.writerows(rows)
    content = buf.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="import-errors-{job_id}.csv"'},
    )


from typing import Optional
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.job import Job


def update_job_status(rq_id: str, status: str, result: Optional[str] = None) -> None:
    db: Session = SessionLocal()
    try:
        job = db.query(Job).filter(Job.rq_id == rq_id).first()
        if job:
            job.status = status
            if result is not None:
                job.result = result
            db.add(job)
            db.commit()
    finally:
        db.close()


def update_job_progress(
    rq_id: str,
    stage: Optional[str] = None,
    progress: Optional[int] = None,
    result: Optional[str] = None,
) -> None:
    """Update job phase/progress during long-running import."""
    db: Session = SessionLocal()
    try:
        job = db.query(Job).filter(Job.rq_id == rq_id).first()
        if job:
            if stage is not None:
                job.phase = stage
            if progress is not None:
                job.progress = min(100, max(0, progress))
            if result is not None:
                job.result = result
            db.add(job)
            db.commit()
    finally:
        db.close()




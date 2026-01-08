from typing import Optional
from rq.job import Job as RQJob
from redis import Redis
from sqlalchemy.orm import Session

from app.core.config import get_settings
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




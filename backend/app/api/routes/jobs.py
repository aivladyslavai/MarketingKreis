from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.models.job import Job
from app.models.user import UserRole
from app.api.deps import require_role

router = APIRouter(prefix="/jobs", tags=["jobs"]) 


@router.get("")
def list_jobs(
    db: Session = Depends(get_db_session),
    current_user=Depends(require_role(UserRole.admin)),
):
    jobs = db.query(Job).order_by(Job.created_at.desc()).limit(50).all()
    return {
        "items": [
            {
                "id": str(j.id),
                "type": j.type,
                "status": "completed" if j.status in ("finished", "completed") else j.status,
                "created_at": j.created_at,
                # progress omitted; frontend handles undefined
            }
            for j in jobs
        ]
    }


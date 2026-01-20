from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db_session
from app.models.job import Job
from app.models.user import UserRole
from app.api.deps import get_org_id, require_role

router = APIRouter(prefix="/jobs", tags=["jobs"]) 


@router.get("")
def list_jobs(
    db: Session = Depends(get_db_session),
    current_user=Depends(require_role(UserRole.admin)),
):
    org = get_org_id(current_user)
    jobs = db.query(Job).filter(Job.organization_id == org).order_by(Job.created_at.desc()).limit(50).all()
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


from fastapi import APIRouter, Depends
from app.api.deps import require_role
from app.models.user import UserRole

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/activities")
def import_activities(current_user=Depends(require_role(UserRole.admin))):
  return {"message": "Import functionality not yet implemented"}


@router.post("/performance")
def import_performance(current_user=Depends(require_role(UserRole.admin))):
  return {"message": "Import functionality not yet implemented"}



from fastapi import APIRouter, Depends
from app.api.deps import require_role
from app.models.user import UserRole

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/activities.csv")
def export_activities_csv(current_user=Depends(require_role(UserRole.admin))):
    """Placeholder for CSV export"""
    return {"message": "Export functionality not yet implemented"}



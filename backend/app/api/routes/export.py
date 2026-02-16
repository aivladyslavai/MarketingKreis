from fastapi import APIRouter, Depends
from app.api.deps import require_admin_step_up
from app.models.user import UserRole

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/activities.csv")
def export_activities_csv(current_user=Depends(require_admin_step_up())):
    """Placeholder for CSV export"""
    return {"message": "Export functionality not yet implemented"}



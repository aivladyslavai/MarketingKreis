from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date

from app.db.session import get_db_session
from app.models.activity import Activity, ActivityType
from app.models.user import User
from app.api.deps import get_current_user, get_org_id, require_writable_user
from app.services.categories import canonical_category_name, resolve_category
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/activities", tags=["activities"])


# Schemas для frontend совместимости
class ActivityFrontend(BaseModel):
    id: str
    title: str
    category: str  # VERKAUFSFOERDERUNG, IMAGE, EMPLOYER_BRANDING, KUNDENPFLEGE
    category_id: Optional[int] = None
    status: str  # ACTIVE, PLANNED, COMPLETED, CANCELLED
    weight: Optional[int] = None
    budgetCHF: Optional[float] = None
    expectedLeads: Optional[int] = None
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    ownerId: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("", response_model=List[ActivityFrontend])
def list_activities(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    List activities owned by the current user.

    Старые демо‑активности без owner_id больше не возвращаются,
    чтобы новые пользователи видели только свои собственные данные.
    """
    try:
        org = get_org_id(current_user)
        q = (
            db.query(Activity)
            .filter(Activity.owner_id == current_user.id, Activity.organization_id == org)
            .order_by(Activity.created_at.desc())
        )
        activities = q.offset(skip).limit(limit).all()

        result: List[ActivityFrontend] = []
        for activity in activities:
            category_ref = getattr(activity, "category", None)
            # Prefer FK-backed category, fallback to legacy text for old rows.
            category_name = (getattr(category_ref, "name", None) or activity.category_name or "").strip()
            category_value = category_name or map_activity_type_to_category(activity.type)

            result.append(
                ActivityFrontend(
                id=str(activity.id),
                title=activity.title or "",
                    category=category_value,
                    category_id=getattr(activity, "category_id", None),
                status=map_activity_status(activity.status),
                weight=activity.weight,
                budgetCHF=float(activity.budget) if activity.budget is not None else None,
                expectedLeads=None,
                start=activity.start_date or activity.created_at,
                end=activity.end_date,
                    ownerId=activity.owner_id,
                notes=activity.expected_output,
                created_at=activity.created_at,
                    updated_at=activity.updated_at,
                )
            )

        return result
    except Exception as e:
        print(f"Error fetching activities: {e}")
        return []


@router.post("", response_model=ActivityFrontend)
def create_activity(
    activity_data: dict,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """Create a new activity for the current user."""
    try:
        org = get_org_id(current_user)
        def parse_date(value) -> Optional[date]:
            if value is None:
                return None
            if isinstance(value, (datetime, date)):
                return value.date() if isinstance(value, datetime) else value
            try:
                # Expect ISO string
                return datetime.fromisoformat(str(value).replace("Z", "+00:00")).date()
            except Exception:
                return None

        raw_category = activity_data.get("category", "VERKAUFSFOERDERUNG")
        category_ref = resolve_category(
            db,
            org,
            category_id=activity_data.get("category_id"),
            category_name=raw_category,
            required=True,
        )

        activity = Activity(
            title=activity_data.get("title", "Untitled"),
            type=map_category_to_activity_type(category_ref.name),
            category_name=category_ref.name,
            category_id=category_ref.id,
            budget=activity_data.get("budgetCHF"),
            expected_output=activity_data.get("notes") or None,
            weight=activity_data.get("weight"),
            start_date=parse_date(activity_data.get("start")),
            end_date=parse_date(activity_data.get("end")),
            status=normalize_activity_status_in(activity_data.get("status") or "ACTIVE"),
            owner_id=current_user.id,
            organization_id=org,
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)

        category_value = (getattr(activity.category, "name", None) or activity.category_name or "").strip() or map_activity_type_to_category(activity.type)

        return ActivityFrontend(
            id=str(activity.id),
            title=activity.title,
            category=category_value,
            category_id=activity.category_id,
            status=map_activity_status(activity.status),
            weight=activity.weight,
            budgetCHF=float(activity.budget) if activity.budget is not None else None,
            expectedLeads=None,
            start=activity.start_date or activity.created_at,
            end=activity.end_date,
            ownerId=activity.owner_id,
            notes=activity.expected_output,
            created_at=activity.created_at,
            updated_at=activity.updated_at,
        )
    except Exception as e:
        print(f"Error creating activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{activity_id}", response_model=ActivityFrontend)
def update_activity(
    activity_id: str,
    activity_data: dict,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """Update an activity owned by the current user."""
    try:
        org = get_org_id(current_user)
        activity = (
            db.query(Activity)
            .filter(Activity.id == int(activity_id), Activity.owner_id == current_user.id, Activity.organization_id == org)
            .first()
        )
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")

        def parse_date(value) -> Optional[date]:
            if value is None:
                return None
            if isinstance(value, (datetime, date)):
                return value.date() if isinstance(value, datetime) else value
            try:
                return datetime.fromisoformat(str(value).replace("Z", "+00:00")).date()
            except Exception:
                return None

        if "title" in activity_data:
            activity.title = activity_data["title"]
        if "notes" in activity_data:
            activity.expected_output = activity_data["notes"]
        if "category" in activity_data or "category_id" in activity_data:
            raw_cat = activity_data.get("category")
            category_ref = resolve_category(
                db,
                org,
                category_id=activity_data.get("category_id"),
                category_name=raw_cat,
                required=True,
            )
            activity.type = map_category_to_activity_type(category_ref.name)
            activity.category_name = category_ref.name
            activity.category_id = category_ref.id
        if "status" in activity_data:
            activity.status = normalize_activity_status_in(activity_data.get("status") or "ACTIVE")
        if "start" in activity_data:
            activity.start_date = parse_date(activity_data.get("start"))
        if "end" in activity_data:
            activity.end_date = parse_date(activity_data.get("end"))
        if "budgetCHF" in activity_data:
            activity.budget = activity_data.get("budgetCHF")
        if "weight" in activity_data:
            activity.weight = activity_data.get("weight")

        db.commit()
        db.refresh(activity)

        category_value = (getattr(activity.category, "name", None) or activity.category_name or "").strip() or map_activity_type_to_category(activity.type)

        return ActivityFrontend(
            id=str(activity.id),
            title=activity.title,
            category=category_value,
            category_id=activity.category_id,
            status=map_activity_status(activity.status),
            weight=activity.weight,
            budgetCHF=float(activity.budget) if activity.budget is not None else None,
            expectedLeads=None,
            start=activity.start_date or activity.created_at,
            end=activity.end_date,
            ownerId=activity.owner_id,
            notes=activity.expected_output,
            created_at=activity.created_at,
            updated_at=activity.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{activity_id}")
def delete_activity(
    activity_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """Delete an activity owned by the current user."""
    try:
        org = get_org_id(current_user)
        activity = (
            db.query(Activity)
            .filter(Activity.id == int(activity_id), Activity.owner_id == current_user.id, Activity.organization_id == org)
            .first()
        )
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        db.delete(activity)
        db.commit()
        return {"ok": True, "message": "Activity deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper functions
def map_activity_type_to_category(activity_type: ActivityType) -> str:
    """Map backend ActivityType to frontend category"""
    mapping = {
        ActivityType.branding: "IMAGE",
        ActivityType.sales: "VERKAUFSFOERDERUNG",
        ActivityType.employer_branding: "EMPLOYER_BRANDING",
        ActivityType.kundenpflege: "KUNDENPFLEGE",
    }
    return mapping.get(activity_type, "VERKAUFSFOERDERUNG")


def map_category_to_activity_type(category: str) -> ActivityType:
    """Map frontend category to backend ActivityType"""
    category = canonical_category_name(category)
    mapping = {
        "VERKAUFSFOERDERUNG": ActivityType.sales,
        "Verkaufsförderung": ActivityType.sales,
        "IMAGE": ActivityType.branding,
        "Image": ActivityType.branding,
        "EMPLOYER_BRANDING": ActivityType.employer_branding,
        "Employer Branding": ActivityType.employer_branding,
        "KUNDENPFLEGE": ActivityType.kundenpflege,
        "Kundenpflege": ActivityType.kundenpflege,
    }
    return mapping.get(category, ActivityType.sales)


def map_activity_status(status: Optional[str]) -> str:
    """Normalize status to frontend enum values"""
    if not status:
        return "ACTIVE"
    value = status.upper()
    # Internal uses DONE, frontend expects COMPLETED
    if value == "DONE":
        return "COMPLETED"
    allowed = {"PLANNED", "ACTIVE", "PAUSED", "CANCELLED", "COMPLETED"}
    return value if value in allowed else "ACTIVE"


def normalize_activity_status_in(status: Optional[str]) -> str:
    """Normalize incoming status to DB values (backward compatible)."""
    if not status:
        return "ACTIVE"
    value = str(status).upper()
    allowed = {"PLANNED", "ACTIVE", "PAUSED", "DONE", "CANCELLED", "COMPLETED"}
    if value not in allowed:
        return "ACTIVE"
    if value == "COMPLETED":
        return "DONE"
    return value

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.db.session import get_db_session
from app.models.calendar import CalendarEntry
from app.models.content_item import ContentItem, ContentItemStatus
from app.models.company import Company
from app.models.deal import Deal
from app.models.user import User
from app.api.deps import get_current_user, get_org_id, require_writable_user

router = APIRouter(prefix="/calendar", tags=["calendar"])


# Small helper to safely cast incoming ids
def _to_int(value: object) -> Optional[int]:
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


# Frontend-compatible schema
class OwnerOut(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class CalendarEventFrontend(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    start: str
    end: Optional[str] = None
    type: str = "event"
    status: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    attendees: Optional[List[str]] = None
    location: Optional[str] = None
    color: Optional[str] = None
    # Simple RRULE-like structure (stored in DB)
    recurrence: Optional[dict] = None
    recurrence_exceptions: Optional[List[str]] = None
    company_id: Optional[int] = None
    project_id: Optional[int] = None
    content_item_id: Optional[int] = None
    owner_id: Optional[int] = None
    owner: Optional[OwnerOut] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


def _normalize_recurrence(value: object) -> Optional[dict]:
    """
    Normalize recurrence payload to a safe JSON dict.
    Expected shape: {freq: daily|weekly|monthly, interval?: int, count?: int, until?: str}
    """
    if not isinstance(value, dict):
        return None
    freq = str(value.get("freq") or "").strip().lower()
    if freq not in {"daily", "weekly", "monthly"}:
        return None
    interval_raw = value.get("interval")
    try:
        interval = int(interval_raw) if interval_raw not in (None, "") else 1
    except Exception:
        interval = 1
    interval = max(1, interval)

    count_raw = value.get("count")
    count: Optional[int] = None
    try:
        if count_raw not in (None, "", 0, "0"):
            c = int(count_raw)
            if c > 0:
                count = c
    except Exception:
        count = None

    until_raw = value.get("until")
    until: Optional[str] = None
    if isinstance(until_raw, str):
        s = until_raw.strip()
        if s:
            # accept YYYY-MM-DD or full ISO; store as string
            until = s

    return {"freq": freq, "interval": interval, **({"count": count} if count else {}), **({"until": until} if until else {})}


def _normalize_exceptions(value: object) -> List[str]:
    if not isinstance(value, list):
        return []
    out: List[str] = []
    for v in value:
        if v is None:
            continue
        s = str(v).strip()
        if not s:
            continue
        # Store ISO date (YYYY-MM-DD) when possible; otherwise keep string
        out.append(s)
    # unique while preserving order
    seen = set()
    uniq: List[str] = []
    for d in out:
        if d in seen:
            continue
        seen.add(d)
        uniq.append(d)
    return uniq


@router.get("", response_model=List[CalendarEventFrontend])
def list_calendar_events(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """List calendar events for the current user."""
    try:
        org = get_org_id(current_user)
        events = (
            db.query(CalendarEntry)
            .filter(CalendarEntry.owner_id == current_user.id, CalendarEntry.organization_id == org)
            .order_by(CalendarEntry.start_time.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        items: List[CalendarEventFrontend] = []
        for event in events:
            items.append(
                CalendarEventFrontend(
                    id=str(event.id),
                    title=event.title or "Untitled Event",
                    description=getattr(event, "description", None),
                    start=(event.start_time or datetime.now()).isoformat(),
                    end=event.end_time.isoformat() if event.end_time else None,
                    type=getattr(event, "event_type", "event") or "event",
                    status=getattr(event, "status", None),
                    category=getattr(event, "category", None),
                    priority=getattr(event, "priority", None),
                    attendees=getattr(event, "attendees", None),
                    location=getattr(event, "location", None),
                    color=getattr(event, "color", None),
                    recurrence=getattr(event, "recurrence", None),
                    recurrence_exceptions=getattr(event, "recurrence_exceptions", None),
                    company_id=getattr(event, "company_id", None),
                    project_id=getattr(event, "project_id", None),
                    content_item_id=getattr(event, "content_item_id", None),
                    owner_id=getattr(event, "owner_id", None),
                    owner=event.owner if getattr(event, "owner", None) is not None else None,
                    created_at=event.created_at.isoformat() if event.created_at else None,
                    updated_at=event.updated_at.isoformat() if event.updated_at else None,
                )
            )

        return items
    except Exception as e:
        print(f"Error fetching calendar events: {e}")
        return []


@router.post("", response_model=CalendarEventFrontend)
def create_calendar_event(
    event_data: dict,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """Create a new calendar event owned by the current user."""
    try:
        org = get_org_id(current_user)
        start_raw = event_data.get("start")
        start_time = (
            datetime.fromisoformat(start_raw.replace("Z", "+00:00"))
            if isinstance(start_raw, str)
            else datetime.now()
        )
        end_raw = event_data.get("end")
        end_time = (
            datetime.fromisoformat(end_raw.replace("Z", "+00:00"))
            if isinstance(end_raw, str) and end_raw
            else start_time
        )

        rec = _normalize_recurrence(event_data.get("recurrence"))
        exceptions = _normalize_exceptions(event_data.get("recurrence_exceptions") or event_data.get("exceptions"))

        company_id = _to_int(event_data.get("company_id"))
        project_id = _to_int(event_data.get("project_id"))
        content_item_id = _to_int(event_data.get("content_item_id"))
        if company_id is not None:
            c = db.query(Company).filter(Company.id == int(company_id), Company.organization_id == org).first()
            if not c:
                raise HTTPException(status_code=404, detail="Company not found")
        if project_id is not None:
            p = db.query(Deal).filter(Deal.id == int(project_id), Deal.organization_id == org).first()
            if not p:
                raise HTTPException(status_code=404, detail="Project not found")
        if content_item_id is not None:
            it = db.query(ContentItem).filter(ContentItem.id == int(content_item_id), ContentItem.organization_id == org).first()
            if not it:
                raise HTTPException(status_code=404, detail="Content item not found")

        event = CalendarEntry(
            title=event_data.get("title", "Untitled Event"),
            description=event_data.get("description"),
            start_time=start_time,
            end_time=end_time,
            event_type=event_data.get("type", "event"),
            status=event_data.get("status"),
            color=event_data.get("color"),
            category=event_data.get("category"),
            priority=event_data.get("priority"),
            location=event_data.get("location"),
            attendees=event_data.get("attendees"),
            recurrence=rec,
            recurrence_exceptions=exceptions,
            company_id=company_id,
            project_id=project_id,
            content_item_id=content_item_id,
            owner_id=current_user.id,
            organization_id=org,
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # If linked to ContentItem, sync scheduled_at
        try:
            if getattr(event, "content_item_id", None):
                item = (
                    db.query(ContentItem)
                    .filter(ContentItem.id == int(event.content_item_id), ContentItem.organization_id == org)
                    .first()
                )
                if item and item.owner_id in (None, current_user.id):
                    item.scheduled_at = event.start_time
                    if item.status in {ContentItemStatus.IDEA, ContentItemStatus.DRAFT, ContentItemStatus.REVIEW, ContentItemStatus.APPROVED}:
                        item.status = ContentItemStatus.SCHEDULED
                    db.add(item)
                    db.commit()
        except Exception:
            db.rollback()
        
        return CalendarEventFrontend(
            id=str(event.id),
            title=event.title,
            description=event.description,
            start=event.start_time.isoformat(),
            end=event.end_time.isoformat() if event.end_time else None,
            type=event.event_type or "event",
            status=event.status,
            category=event.category,
            priority=event.priority,
            attendees=event.attendees,
            location=event.location,
            color=event.color,
            recurrence=event.recurrence,
            recurrence_exceptions=event.recurrence_exceptions,
            company_id=event.company_id,
            project_id=event.project_id,
            content_item_id=getattr(event, "content_item_id", None),
            owner_id=event.owner_id,
            owner=event.owner if getattr(event, "owner", None) is not None else None,
            created_at=event.created_at.isoformat() if event.created_at else None,
            updated_at=event.updated_at.isoformat() if event.updated_at else None,
        )
    except Exception as e:
        print(f"Error creating calendar event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{event_id}", response_model=CalendarEventFrontend)
def update_calendar_event(
    event_id: str,
    event_data: dict,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """Update a calendar event owned by the current user."""
    try:
        org = get_org_id(current_user)
        event = (
            db.query(CalendarEntry)
            .filter(
                CalendarEntry.id == int(event_id),
                CalendarEntry.owner_id == current_user.id,
                CalendarEntry.organization_id == org,
            )
            .first()
        )
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        if "title" in event_data:
            event.title = event_data["title"]
        if "description" in event_data:
            event.description = event_data.get("description")
        if "start" in event_data:
            raw_start = event_data.get("start")
            if isinstance(raw_start, str):
                event.start_time = datetime.fromisoformat(raw_start.replace("Z", "+00:00"))
        if "end" in event_data:
            raw_end = event_data.get("end")
            if isinstance(raw_end, str) and raw_end:
                event.end_time = datetime.fromisoformat(raw_end.replace("Z", "+00:00"))
        if "status" in event_data:
            event.status = event_data.get("status")
        if "color" in event_data:
            event.color = event_data.get("color")
        if "type" in event_data:
            event.event_type = event_data.get("type")
        if "category" in event_data:
            event.category = event_data.get("category")
        if "priority" in event_data:
            event.priority = event_data.get("priority")
        if "location" in event_data:
            event.location = event_data.get("location")
        if "attendees" in event_data:
            event.attendees = event_data.get("attendees")
        if "recurrence" in event_data:
            event.recurrence = _normalize_recurrence(event_data.get("recurrence"))
        if "recurrence_exceptions" in event_data or "exceptions" in event_data:
            event.recurrence_exceptions = _normalize_exceptions(
                event_data.get("recurrence_exceptions") or event_data.get("exceptions")
            )
        if "add_exception_date" in event_data:
            add_raw = event_data.get("add_exception_date")
            add_s = str(add_raw or "").strip()
            if add_s:
                existing = _normalize_exceptions(getattr(event, "recurrence_exceptions", None) or [])
                if add_s not in existing:
                    existing.append(add_s)
                event.recurrence_exceptions = existing
        if "remove_exception_date" in event_data:
            rm_raw = event_data.get("remove_exception_date")
            rm_s = str(rm_raw or "").strip()
            if rm_s:
                existing = _normalize_exceptions(getattr(event, "recurrence_exceptions", None) or [])
                event.recurrence_exceptions = [d for d in existing if d != rm_s]
        if "company_id" in event_data:
            cid = _to_int(event_data.get("company_id"))
            if cid is None:
                event.company_id = None
            else:
                c = db.query(Company).filter(Company.id == int(cid), Company.organization_id == org).first()
                if not c:
                    raise HTTPException(status_code=404, detail="Company not found")
                event.company_id = int(cid)
        if "project_id" in event_data:
            pid = _to_int(event_data.get("project_id"))
            if pid is None:
                event.project_id = None
            else:
                p = db.query(Deal).filter(Deal.id == int(pid), Deal.organization_id == org).first()
                if not p:
                    raise HTTPException(status_code=404, detail="Project not found")
                event.project_id = int(pid)
        if "content_item_id" in event_data:
            iid = _to_int(event_data.get("content_item_id"))
            if iid is None:
                event.content_item_id = None
            else:
                it = db.query(ContentItem).filter(ContentItem.id == int(iid), ContentItem.organization_id == org).first()
                if not it:
                    raise HTTPException(status_code=404, detail="Content item not found")
                event.content_item_id = int(iid)
        # Never allow changing owner via API – it must always be the current user

        db.commit()
        db.refresh(event)

        # If linked to ContentItem, sync scheduled_at
        try:
            if getattr(event, "content_item_id", None):
                item = (
                    db.query(ContentItem)
                    .filter(ContentItem.id == int(event.content_item_id), ContentItem.organization_id == org)
                    .first()
                )
                if item and item.owner_id in (None, current_user.id):
                    item.scheduled_at = event.start_time
                    if item.status in {ContentItemStatus.IDEA, ContentItemStatus.DRAFT, ContentItemStatus.REVIEW, ContentItemStatus.APPROVED}:
                        item.status = ContentItemStatus.SCHEDULED
                    db.add(item)
                    db.commit()
        except Exception:
            db.rollback()

        return CalendarEventFrontend(
            id=str(event.id),
            title=event.title,
            description=event.description,
            start=event.start_time.isoformat(),
            end=event.end_time.isoformat() if event.end_time else None,
            type=event.event_type or "event",
            status=event.status,
            category=event.category,
            priority=event.priority,
            attendees=event.attendees,
            location=event.location,
            color=event.color,
            recurrence=event.recurrence,
            recurrence_exceptions=event.recurrence_exceptions,
            company_id=event.company_id,
            project_id=event.project_id,
            content_item_id=getattr(event, "content_item_id", None),
            owner_id=event.owner_id,
            owner=event.owner if getattr(event, "owner", None) is not None else None,
            created_at=event.created_at.isoformat() if event.created_at else None,
            updated_at=event.updated_at.isoformat() if event.updated_at else None,
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating calendar event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{event_id}")
def delete_calendar_event(
    event_id: str,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """Delete a calendar event owned by the current user."""
    try:
        org = get_org_id(current_user)
        event = (
            db.query(CalendarEntry)
            .filter(
                CalendarEntry.id == int(event_id),
                CalendarEntry.owner_id == current_user.id,
                CalendarEntry.organization_id == org,
            )
            .first()
        )
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        db.delete(event)
        db.commit()
        return {"ok": True, "message": "Event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting calendar event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

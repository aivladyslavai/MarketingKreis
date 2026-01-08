from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.db.session import get_db_session
from app.models.calendar import CalendarEntry
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/calendar", tags=["calendar"])


# Small helper to safely cast incoming ids
def _to_int(value: object) -> Optional[int]:
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


# Frontend-compatible schema
class CalendarEventFrontend(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    start: str
    end: Optional[str] = None
    type: str = "event"
    status: Optional[str] = None
    attendees: Optional[List[str]] = None
    location: Optional[str] = None
    color: Optional[str] = None
    company_id: Optional[int] = None
    project_id: Optional[int] = None
    owner_id: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("", response_model=List[CalendarEventFrontend])
def list_calendar_events(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """List calendar events for the current user."""
    try:
        events = (
            db.query(CalendarEntry)
            .filter(CalendarEntry.owner_id == current_user.id)
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
                    attendees=None,
                    location=None,
                    color=getattr(event, "color", None),
                    company_id=getattr(event, "company_id", None),
                    project_id=getattr(event, "project_id", None),
                    owner_id=getattr(event, "owner_id", None),
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
    current_user: User = Depends(get_current_user),
):
    """Create a new calendar event owned by the current user."""
    try:
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

        event = CalendarEntry(
            title=event_data.get("title", "Untitled Event"),
            description=event_data.get("description"),
            start_time=start_time,
            end_time=end_time,
            event_type=event_data.get("type", "event"),
            status=event_data.get("status"),
            color=event_data.get("color"),
            company_id=_to_int(event_data.get("company_id")),
            project_id=_to_int(event_data.get("project_id")),
            owner_id=current_user.id,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return CalendarEventFrontend(
            id=str(event.id),
            title=event.title,
            description=event.description,
            start=event.start_time.isoformat(),
            end=event.end_time.isoformat() if event.end_time else None,
            type=event.event_type or "event",
            status=event.status,
            attendees=event_data.get("attendees"),
            location=event_data.get("location"),
            color=event.color,
            company_id=event.company_id,
            project_id=event.project_id,
            owner_id=event.owner_id,
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
    current_user: User = Depends(get_current_user),
):
    """Update a calendar event owned by the current user."""
    try:
        event = (
            db.query(CalendarEntry)
            .filter(
                CalendarEntry.id == int(event_id),
                CalendarEntry.owner_id == current_user.id,
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
        if "company_id" in event_data:
            event.company_id = _to_int(event_data.get("company_id"))
        if "project_id" in event_data:
            event.project_id = _to_int(event_data.get("project_id"))
        # Never allow changing owner via API – it must always be the current user

        db.commit()
        db.refresh(event)

        return CalendarEventFrontend(
            id=str(event.id),
            title=event.title,
            description=event.description,
            start=event.start_time.isoformat(),
            end=event.end_time.isoformat() if event.end_time else None,
            type=event.event_type or "event",
            status=event.status,
            attendees=event_data.get("attendees"),
            location=event_data.get("location"),
            color=event.color,
            company_id=event.company_id,
            project_id=event.project_id,
            owner_id=event.owner_id,
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
    current_user: User = Depends(get_current_user),
):
    """Delete a calendar event owned by the current user."""
    try:
        event = (
            db.query(CalendarEntry)
            .filter(
                CalendarEntry.id == int(event_id),
                CalendarEntry.owner_id == current_user.id,
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

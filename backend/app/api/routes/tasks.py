from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_org_id, require_writable_user
from app.db.session import get_db_session
from app.models.activity import Activity
from app.models.calendar import CalendarEntry
from app.models.company import Company
from app.models.deal import Deal
from app.models.task import Task
from app.models.user import User, UserRole
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate


router = APIRouter(prefix="/tasks", tags=["tasks"])

ALLOWED_STATUSES = {"TODO", "IN_PROGRESS", "DONE", "CANCELLED"}
ALLOWED_PRIORITIES = {"LOW", "MEDIUM", "HIGH", "URGENT"}


def _normalize_status(value: Optional[str]) -> str:
    v = str(value or "TODO").strip().upper()
    return v if v in ALLOWED_STATUSES else "TODO"


def _normalize_priority(value: Optional[str]) -> str:
    v = str(value or "MEDIUM").strip().upper()
    return v if v in ALLOWED_PRIORITIES else "MEDIUM"


def _resolve_relations(
    db: Session,
    org: int,
    *,
    company_id: Optional[int],
    project_id: Optional[int],
    activity_id: Optional[int],
    event_id: Optional[int],
) -> tuple[Optional[int], Optional[int], Optional[int], Optional[int]]:
    company = None
    project = None
    activity = None
    event = None

    if company_id is not None:
        company = db.query(Company).filter(Company.id == int(company_id), Company.organization_id == org).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

    if project_id is not None:
        project = db.query(Deal).filter(Deal.id == int(project_id), Deal.organization_id == org).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        if getattr(project, "company_id", None):
            if company is None:
                company_id = int(project.company_id)
            elif int(company.id) != int(project.company_id):
                raise HTTPException(status_code=400, detail="Project does not belong to selected company")

    if activity_id is not None:
        activity = db.query(Activity).filter(Activity.id == int(activity_id), Activity.organization_id == org).first()
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        if getattr(activity, "project_id", None):
            if project is None:
                project_id = int(activity.project_id)
            elif int(project.id) != int(activity.project_id):
                raise HTTPException(status_code=400, detail="Activity does not belong to selected project")
        if getattr(activity, "company_id", None):
            if company is None:
                company_id = int(activity.company_id)
            elif int(company.id) != int(activity.company_id):
                raise HTTPException(status_code=400, detail="Activity does not belong to selected company")

    if event_id is not None:
        event = db.query(CalendarEntry).filter(CalendarEntry.id == int(event_id), CalendarEntry.organization_id == org).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        if getattr(event, "project_id", None):
            if project is None:
                project_id = int(event.project_id)
            elif int(project.id) != int(event.project_id):
                raise HTTPException(status_code=400, detail="Event does not belong to selected project")
        if getattr(event, "company_id", None):
            if company is None:
                company_id = int(event.company_id)
            elif int(company.id) != int(event.company_id):
                raise HTTPException(status_code=400, detail="Event does not belong to selected company")
        if getattr(event, "activity_id", None):
            if activity is None:
                activity_id = int(event.activity_id)
            elif int(activity.id) != int(event.activity_id):
                raise HTTPException(status_code=400, detail="Event does not belong to selected activity")

    return company_id, project_id, activity_id, event_id


def _query_visible_tasks(db: Session, current_user: User):
    org = get_org_id(current_user)
    query = db.query(Task).filter(Task.organization_id == org)
    if current_user.role not in {UserRole.admin, UserRole.editor, UserRole.owner}:
        query = query.filter((Task.owner_id == current_user.id) | (Task.owner_id.is_(None)))
    return query


@router.get("", response_model=List[TaskOut])
def list_tasks(
    status: Optional[str] = None,
    q: Optional[str] = None,
    company_id: Optional[int] = None,
    project_id: Optional[int] = None,
    activity_id: Optional[int] = None,
    event_id: Optional[int] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    query = _query_visible_tasks(db, current_user)
    if status:
        query = query.filter(Task.status == _normalize_status(status))
    if company_id is not None:
        query = query.filter(Task.company_id == int(company_id))
    if project_id is not None:
        query = query.filter(Task.project_id == int(project_id))
    if activity_id is not None:
        query = query.filter(Task.activity_id == int(activity_id))
    if event_id is not None:
        query = query.filter(Task.event_id == int(event_id))
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(or_(Task.title.ilike(like), Task.description.ilike(like)))
    return query.order_by(Task.due_at.is_(None), Task.due_at.asc(), Task.created_at.desc()).all()


@router.post("", response_model=TaskOut)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    org = get_org_id(current_user)
    company_id, project_id, activity_id, event_id = _resolve_relations(
        db,
        org,
        company_id=payload.company_id,
        project_id=payload.project_id,
        activity_id=payload.activity_id,
        event_id=payload.event_id,
    )
    owner_id = payload.owner_id if current_user.role in {UserRole.admin, UserRole.editor, UserRole.owner} else current_user.id
    task = Task(
        organization_id=org,
        title=payload.title.strip(),
        description=payload.description.strip() if payload.description else None,
        status=_normalize_status(payload.status),
        priority=_normalize_priority(payload.priority),
        due_at=payload.due_at,
        company_id=company_id,
        project_id=project_id,
        activity_id=activity_id,
        event_id=event_id,
        owner_id=owner_id or current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    task = _query_visible_tasks(db, current_user).filter(Task.id == int(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    data = payload.model_dump(exclude_unset=True)
    if "company_id" in data or "project_id" in data or "activity_id" in data or "event_id" in data:
        task.company_id, task.project_id, task.activity_id, task.event_id = _resolve_relations(
            db,
            get_org_id(current_user),
            company_id=data.get("company_id", task.company_id),
            project_id=data.get("project_id", task.project_id),
            activity_id=data.get("activity_id", task.activity_id),
            event_id=data.get("event_id", task.event_id),
        )
    if "title" in data and data["title"]:
        task.title = str(data["title"]).strip()
    if "description" in data:
        task.description = str(data["description"]).strip() if data["description"] else None
    if "status" in data:
        task.status = _normalize_status(data["status"])
    if "priority" in data:
        task.priority = _normalize_priority(data["priority"])
    if "due_at" in data:
        task.due_at = data["due_at"]
    if "owner_id" in data and current_user.role in {UserRole.admin, UserRole.editor, UserRole.owner}:
        task.owner_id = data["owner_id"]
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    task = _query_visible_tasks(db, current_user).filter(Task.id == int(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True, "id": int(task_id)}

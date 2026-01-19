from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.api.deps import get_db_session, get_current_user, is_demo_user, require_writable_user
from app.models.user import User, UserRole
from app.models.content_task import ContentTask, ContentTaskStatus, ContentTaskPriority
from app.models.content_item import ContentItem
from app.schemas.content_task import ContentTaskCreate, ContentTaskUpdate, ContentTaskOut


router = APIRouter(prefix="/content/tasks", tags=["content-tasks"])


@router.get("", response_model=List[ContentTaskOut])
def list_content_tasks(
    status: Optional[ContentTaskStatus] = None,
    owner_id: Optional[int] = None,
    unassigned: bool = False,
    content_item_id: Optional[int] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    List content tasks for the current user.

    For now, we return tasks owned by the user, ordered by deadline then created_at.
    """
    can_manage_all = current_user.role in {UserRole.admin, UserRole.editor}
    demo_mode = is_demo_user(current_user)

    query = db.query(ContentTask)
    if demo_mode:
        # Do not expose unassigned/shared tasks in demo mode.
        query = query.filter(ContentTask.owner_id == current_user.id)
    elif can_manage_all:
        if unassigned:
            query = query.filter(ContentTask.owner_id.is_(None))
        elif owner_id is not None:
            query = query.filter(ContentTask.owner_id == owner_id)
    else:
        # regular users can only see their tasks + unassigned
        query = query.filter((ContentTask.owner_id == current_user.id) | (ContentTask.owner_id.is_(None)))

    if status is not None:
        query = query.filter(ContentTask.status == status)
    if content_item_id is not None:
        query = query.filter(ContentTask.content_item_id == int(content_item_id))
    if q:
        qv = q.strip()
        if qv:
            like = f"%{qv}%"
            query = query.filter(
                or_(
                    ContentTask.title.ilike(like),
                    ContentTask.channel.ilike(like),
                    ContentTask.notes.ilike(like),
                )
            )

    tasks = (
        query.order_by(
            ContentTask.deadline.is_(None),  # tasks with deadline first
            ContentTask.deadline.asc(),
            ContentTask.created_at.desc(),
        )
        .all()
    )
    return tasks


@router.post("", response_model=ContentTaskOut)
def create_content_task(
    payload: ContentTaskCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """Create a new content task for the current user."""
    can_manage_all = current_user.role in {UserRole.admin, UserRole.editor}

    desired_owner_id: Optional[int] = current_user.id
    # Allow admins/editors to explicitly assign tasks (including unassigned = None)
    if can_manage_all and hasattr(payload, "model_fields_set") and "owner_id" in payload.model_fields_set:
        desired_owner_id = payload.owner_id
        if desired_owner_id is not None:
            exists = db.query(User).filter(User.id == int(desired_owner_id)).first()
            if not exists:
                raise HTTPException(status_code=400, detail="Owner user not found")

    task = ContentTask(
        title=payload.title.strip(),
        channel=(payload.channel or "Website").strip(),
        format=payload.format.strip() if payload.format else None,
        status=payload.status or ContentTaskStatus.TODO,
        priority=payload.priority or ContentTaskPriority.MEDIUM,
        notes=payload.notes.strip() if payload.notes else None,
        deadline=payload.deadline,
        activity_id=payload.activity_id,
        content_item_id=payload.content_item_id,
        recurrence=payload.recurrence,
        owner_id=desired_owner_id,
    )
    if payload.content_item_id is not None:
        item = db.query(ContentItem).filter(ContentItem.id == int(payload.content_item_id)).first()
        if not item:
            raise HTTPException(status_code=400, detail="Content item not found")
        # demo users can only link to their own items; regular users to own/unassigned; admins to any
        if is_demo_user(current_user):
            if item.owner_id != current_user.id:
                raise HTTPException(status_code=403, detail="Cannot link task to this content item")
        elif not can_manage_all:
            if item.owner_id not in (None, current_user.id):
                raise HTTPException(status_code=403, detail="Cannot link task to this content item")
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=ContentTaskOut)
def update_content_task(
    task_id: int,
    payload: ContentTaskUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """Patch update a content task. Only the owner can modify their tasks."""
    can_manage_all = current_user.role in {UserRole.admin, UserRole.editor}
    q = db.query(ContentTask).filter(ContentTask.id == task_id)
    if not can_manage_all:
        q = q.filter(ContentTask.owner_id == current_user.id)
    task = q.first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    data = payload.model_dump(exclude_unset=True)
    if "title" in data and data["title"]:
        task.title = data["title"].strip()
    if "channel" in data and data["channel"] is not None:
        task.channel = data["channel"].strip()
    if "format" in data:
        task.format = data["format"].strip() if data["format"] else None
    if "status" in data and data["status"] is not None:
        task.status = data["status"]
    if "priority" in data and data["priority"] is not None:
        task.priority = data["priority"]
    if "notes" in data:
        task.notes = data["notes"].strip() if data["notes"] else None
    if "deadline" in data:
        task.deadline = data["deadline"]
    if "activity_id" in data:
        task.activity_id = data["activity_id"]
    if "content_item_id" in data:
        cid = data["content_item_id"]
        if cid is None:
            task.content_item_id = None
        else:
            item = db.query(ContentItem).filter(ContentItem.id == int(cid)).first()
            if not item:
                raise HTTPException(status_code=400, detail="Content item not found")
            if is_demo_user(current_user):
                if item.owner_id != current_user.id:
                    raise HTTPException(status_code=403, detail="Cannot link task to this content item")
            elif not can_manage_all:
                if item.owner_id not in (None, current_user.id):
                    raise HTTPException(status_code=403, detail="Cannot link task to this content item")
            task.content_item_id = int(cid)
    if "recurrence" in data:
        task.recurrence = data["recurrence"]
    if "owner_id" in data:
        if not can_manage_all:
            # ignore for regular users
            pass
        else:
            desired_owner_id = data["owner_id"]
            if desired_owner_id is not None:
                exists = db.query(User).filter(User.id == int(desired_owner_id)).first()
                if not exists:
                    raise HTTPException(status_code=400, detail="Owner user not found")
            task.owner_id = desired_owner_id

    # Ensure updated_at reflects manual changes even if DB back-end doesn't auto-update
    task.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_content_task(
    task_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """Delete a content task. Only the owner can delete their tasks."""
    can_manage_all = current_user.role in {UserRole.admin, UserRole.editor}
    q = db.query(ContentTask).filter(ContentTask.id == task_id)
    if not can_manage_all:
        q = q.filter(ContentTask.owner_id == current_user.id)
    task = q.first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"ok": True, "id": task_id}


def _add_months(dt: datetime, months: int) -> datetime:
    # Simple month math without extra deps.
    y = dt.year + (dt.month - 1 + months) // 12
    m = (dt.month - 1 + months) % 12 + 1
    d = dt.day
    # clamp day to last day of target month
    import calendar

    last = calendar.monthrange(y, m)[1]
    d = min(d, last)
    return dt.replace(year=y, month=m, day=d)


@router.post("/{task_id}/complete")
def complete_content_task(
    task_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """
    Mark task as ARCHIVED and (if recurrence is configured) create the next occurrence.
    This is used by templates / recurring operational tasks.
    """
    can_manage_all = current_user.role in {UserRole.admin, UserRole.editor}
    q = db.query(ContentTask).filter(ContentTask.id == task_id)
    if not can_manage_all:
        q = q.filter(ContentTask.owner_id == current_user.id)
    task = q.first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    prev = task.status
    task.status = ContentTaskStatus.ARCHIVED
    task.updated_at = datetime.utcnow()
    db.add(task)
    db.commit()
    db.refresh(task)

    next_task: Optional[ContentTask] = None
    rec = getattr(task, "recurrence", None)
    if isinstance(rec, dict):
        freq = str(rec.get("freq") or "").strip().lower()
        try:
            interval = int(rec.get("interval") or 1)
        except Exception:
            interval = 1
        interval = max(1, interval)
        count_raw = rec.get("count")
        count: Optional[int] = None
        try:
            if count_raw not in (None, "", 0, "0"):
                count = int(count_raw)
        except Exception:
            count = None

        # If count is specified, stop after 1
        if count is None or count > 1:
            base_deadline = task.deadline
            if base_deadline is None:
                base_deadline = datetime.utcnow()

            if freq == "daily":
                next_deadline = base_deadline + timedelta(days=interval)
            elif freq == "weekly":
                next_deadline = base_deadline + timedelta(days=7 * interval)
            elif freq == "monthly":
                next_deadline = _add_months(base_deadline, interval)
            else:
                next_deadline = None

            next_rec = dict(rec)
            if count is not None and count > 1:
                next_rec["count"] = count - 1

            next_task = ContentTask(
                title=task.title,
                channel=task.channel,
                format=task.format,
                status=ContentTaskStatus.TODO,
                priority=task.priority,
                notes=task.notes,
                deadline=next_deadline,
                activity_id=task.activity_id,
                content_item_id=getattr(task, "content_item_id", None),
                recurrence=next_rec,
                owner_id=task.owner_id,
            )
            db.add(next_task)
            db.commit()
            db.refresh(next_task)

    return {
        "ok": True,
        "completed": task,
        "next": next_task,
        "prev_status": prev,
    }




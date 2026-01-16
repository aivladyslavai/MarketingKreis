from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.deps import get_db_session, get_current_user, is_demo_user, require_writable_user
from app.models.user import User, UserRole
from app.models.content_task import ContentTask, ContentTaskStatus, ContentTaskPriority
from app.schemas.content_task import ContentTaskCreate, ContentTaskUpdate, ContentTaskOut


router = APIRouter(prefix="/content/tasks", tags=["content-tasks"])


@router.get("", response_model=List[ContentTaskOut])
def list_content_tasks(
    status: Optional[ContentTaskStatus] = None,
    owner_id: Optional[int] = None,
    unassigned: bool = False,
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
        owner_id=desired_owner_id,
    )
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




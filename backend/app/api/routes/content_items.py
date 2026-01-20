from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import RedirectResponse, Response
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db_session, get_org_id, is_demo_user, require_writable_user
from app.core.config import get_settings
from app.models.activity import Activity
from app.models.calendar import CalendarEntry
from app.models.company import Company
from app.models.content_item import (
    ContentAssetKind,
    ContentAutomationRule,
    ContentItem,
    ContentItemAsset,
    ContentItemAuditLog,
    ContentItemChecklistItem,
    ContentItemComment,
    ContentItemReviewer,
    ContentItemStatus,
    ContentItemVersion,
    ContentTemplate,
    Notification,
)
from app.models.content_task import ContentTask, ContentTaskPriority, ContentTaskStatus
from app.models.deal import Deal
from app.models.upload import Upload
from app.models.user import User, UserRole
from app.schemas.content_item import (
    ContentAuditOut,
    ContentAssetCreate,
    ContentAssetOut,
    ContentAssetUpdate,
    ContentAutomationRuleCreate,
    ContentAutomationRuleOut,
    ContentAutomationRuleUpdate,
    ContentChecklistItemCreate,
    ContentChecklistItemOut,
    ContentChecklistItemUpdate,
    ContentItemCommentCreate,
    ContentItemCommentOut,
    ContentItemCreate,
    ContentItemOut,
    ContentItemReviewerCreate,
    ContentItemReviewerOut,
    ContentItemUpdate,
    ContentTemplateCreate,
    ContentTemplateOut,
    ContentTemplateUpdate,
    ContentVersionCreate,
    ContentVersionOut,
    NotificationOut,
)

# NOTE: Some imports above appear duplicated because schemas share names. Keep explicit.


router = APIRouter(prefix="/content", tags=["content"])


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _norm_tags(tags: Optional[List[str]]) -> Optional[List[str]]:
    if tags is None:
        return None
    out: List[str] = []
    seen = set()
    for t in tags:
        s = str(t or "").strip()
        if not s:
            continue
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(s)
    return out or []


def _can_manage_all(user: User) -> bool:
    return user.role in {UserRole.admin, UserRole.editor}


def _require_item_access(db: Session, *, item_id: int, user: User) -> ContentItem:
    org = get_org_id(user)
    q = db.query(ContentItem).filter(ContentItem.id == item_id, ContentItem.organization_id == org)
    if is_demo_user(user):
        q = q.filter(ContentItem.owner_id == user.id)
    elif not _can_manage_all(user):
        q = q.filter(or_(ContentItem.owner_id == user.id, ContentItem.owner_id.is_(None)))
    item = q.first()
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")
    return item


def _audit(db: Session, *, item_id: int, actor_id: Optional[int], action: str, data: Optional[Dict[str, Any]] = None) -> None:
    try:
        db.add(ContentItemAuditLog(item_id=item_id, actor_id=actor_id, action=action, data=data or None))
        db.commit()
    except Exception:
        db.rollback()


def _sync_calendar_for_item(db: Session, *, item: ContentItem, actor: User) -> None:
    """
    Ensure ContentItem.scheduled_at is mirrored as a CalendarEntry.

    Rules:
    - If scheduled_at is set: upsert calendar entry with content_item_id
    - If scheduled_at is cleared: delete existing linked calendar entry (best-effort)
    """
    try:
        org = int(getattr(item, "organization_id", None) or get_org_id(actor))
        owner_id = item.owner_id or actor.id
        existing = (
            db.query(CalendarEntry)
            .filter(
                CalendarEntry.content_item_id == item.id,
                CalendarEntry.owner_id == owner_id,
                CalendarEntry.organization_id == org,
            )
            .first()
        )
        if not existing:
            # Backward-compat: older rows may have organization_id null before backfill.
            existing = (
                db.query(CalendarEntry)
                .filter(
                    CalendarEntry.content_item_id == item.id,
                    CalendarEntry.owner_id == owner_id,
                    CalendarEntry.organization_id.is_(None),
                )
                .first()
            )
            if existing:
                existing.organization_id = org
                db.add(existing)
                db.commit()
        if not item.scheduled_at:
            if existing:
                db.delete(existing)
                db.commit()
            return

        start = item.scheduled_at
        end = start + timedelta(minutes=30)
        title = f"Content: {item.title}"
        category = (item.channel or "Content").strip() if item.channel else "Content"

        if not existing:
            ev = CalendarEntry(
                title=title,
                description=(item.brief or None),
                start_time=start,
                end_time=end,
                event_type="content",
                status="PLANNED",
                category=category,
                priority="medium",
                color="#a78bfa",
                company_id=item.company_id,
                project_id=item.project_id,
                activity_id=item.activity_id,
                content_item_id=item.id,
                owner_id=owner_id,
                organization_id=org,
            )
            db.add(ev)
            db.commit()
            return

        changed = False
        if existing.title != title:
            existing.title = title
            changed = True
        if existing.start_time != start:
            existing.start_time = start
            changed = True
        if existing.end_time != end:
            existing.end_time = end
            changed = True
        if getattr(existing, "category", None) != category:
            existing.category = category
            changed = True
        if getattr(existing, "company_id", None) != item.company_id:
            existing.company_id = item.company_id
            changed = True
        if getattr(existing, "project_id", None) != item.project_id:
            existing.project_id = item.project_id
            changed = True
        if getattr(existing, "activity_id", None) != item.activity_id:
            existing.activity_id = item.activity_id
            changed = True
        if changed:
            db.add(existing)
            db.commit()
    except Exception:
        db.rollback()


@router.get("/items", response_model=List[ContentItemOut])
def list_content_items(
    q: Optional[str] = None,
    status: Optional[ContentItemStatus] = None,
    owner_id: Optional[int] = None,
    unassigned: bool = False,
    company_id: Optional[int] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    can_manage_all = _can_manage_all(current_user)
    demo_mode = is_demo_user(current_user)
    org = get_org_id(current_user)

    query = db.query(ContentItem).filter(ContentItem.organization_id == org)
    if demo_mode:
        query = query.filter(ContentItem.owner_id == current_user.id)
    elif can_manage_all:
        if unassigned:
            query = query.filter(ContentItem.owner_id.is_(None))
        elif owner_id is not None:
            query = query.filter(ContentItem.owner_id == owner_id)
    else:
        query = query.filter((ContentItem.owner_id == current_user.id) | (ContentItem.owner_id.is_(None)))

    if status is not None:
        query = query.filter(ContentItem.status == status)
    if company_id is not None:
        query = query.filter(ContentItem.company_id == company_id)
    if project_id is not None:
        query = query.filter(ContentItem.project_id == project_id)
    if q:
        qv = q.strip()
        if qv:
            like = f"%{qv}%"
            query = query.filter(or_(ContentItem.title.ilike(like), ContentItem.channel.ilike(like), ContentItem.brief.ilike(like)))

    return query.order_by(ContentItem.updated_at.desc()).limit(500).all()


@router.post("/items", response_model=ContentItemOut)
def create_content_item(
    payload: ContentItemCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    can_manage_all = _can_manage_all(current_user)
    org = get_org_id(current_user)
    desired_owner_id: Optional[int] = current_user.id
    if can_manage_all and hasattr(payload, "model_fields_set") and "owner_id" in payload.model_fields_set:
        desired_owner_id = payload.owner_id
        if desired_owner_id is not None:
            exists = (
                db.query(User)
                .filter(User.id == int(desired_owner_id), User.organization_id == org)
                .first()
            )
            if not exists:
                raise HTTPException(status_code=400, detail="Owner user not found")

    # Validate FK links belong to the same organization (avoid cross-tenant linking).
    if payload.company_id is not None:
        company = (
            db.query(Company)
            .filter(Company.id == int(payload.company_id), Company.organization_id == org)
            .first()
        )
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
    if payload.project_id is not None:
        project = (
            db.query(Deal)
            .filter(Deal.id == int(payload.project_id), Deal.organization_id == org)
            .first()
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
    if payload.activity_id is not None:
        act = (
            db.query(Activity)
            .filter(Activity.id == int(payload.activity_id), Activity.organization_id == org)
            .first()
        )
        if not act:
            raise HTTPException(status_code=404, detail="Activity not found")

    item = ContentItem(
        title=payload.title.strip(),
        channel=(payload.channel or "Website").strip(),
        format=payload.format.strip() if payload.format else None,
        status=payload.status or ContentItemStatus.DRAFT,
        tags=_norm_tags(payload.tags),
        brief=payload.brief,
        body=payload.body,
        tone=payload.tone,
        language=payload.language or "de",
        due_at=payload.due_at,
        scheduled_at=payload.scheduled_at,
        published_at=payload.published_at,
        company_id=payload.company_id,
        project_id=payload.project_id,
        activity_id=payload.activity_id,
        owner_id=desired_owner_id,
        blocked_reason=payload.blocked_reason,
        blocked_by=payload.blocked_by,
        organization_id=org,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    _audit(db, item_id=item.id, actor_id=current_user.id, action="content_item.created", data={"id": item.id})
    _sync_calendar_for_item(db, item=item, actor=current_user)
    db.refresh(item)
    return item


@router.get("/items/{item_id}", response_model=ContentItemOut)
def get_content_item(
    item_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    return _require_item_access(db, item_id=item_id, user=current_user)


@router.patch("/items/{item_id}", response_model=ContentItemOut)
def update_content_item(
    item_id: int,
    payload: ContentItemUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    can_manage_all = _can_manage_all(current_user)
    org = get_org_id(current_user)

    data = payload.model_dump(exclude_unset=True)
    create_version = bool(data.pop("create_version", False))
    before = {
        "title": item.title,
        "channel": item.channel,
        "format": item.format,
        "status": str(item.status) if item.status is not None else None,
        "scheduled_at": item.scheduled_at.isoformat() if item.scheduled_at else None,
        "due_at": item.due_at.isoformat() if item.due_at else None,
    }

    if "title" in data and data["title"]:
        item.title = data["title"].strip()
    if "channel" in data and data["channel"] is not None:
        item.channel = data["channel"].strip() or "Website"
    if "format" in data:
        item.format = data["format"].strip() if data["format"] else None
    if "status" in data and data["status"] is not None:
        item.status = data["status"]
    if "tags" in data:
        item.tags = _norm_tags(data.get("tags"))
    if "brief" in data:
        item.brief = data.get("brief")
    if "body" in data:
        item.body = data.get("body")
    if "tone" in data:
        item.tone = data.get("tone")
    if "language" in data and data["language"] is not None:
        item.language = (data["language"] or "de").strip()
    if "due_at" in data:
        item.due_at = data.get("due_at")
    if "scheduled_at" in data:
        item.scheduled_at = data.get("scheduled_at")
    if "published_at" in data:
        item.published_at = data.get("published_at")
    if "company_id" in data:
        cid = data.get("company_id")
        if cid is None:
            item.company_id = None
        else:
            company = db.query(Company).filter(Company.id == int(cid), Company.organization_id == org).first()
            if not company:
                raise HTTPException(status_code=404, detail="Company not found")
            item.company_id = int(cid)
    if "project_id" in data:
        pid = data.get("project_id")
        if pid is None:
            item.project_id = None
        else:
            project = db.query(Deal).filter(Deal.id == int(pid), Deal.organization_id == org).first()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            item.project_id = int(pid)
    if "activity_id" in data:
        aid = data.get("activity_id")
        if aid is None:
            item.activity_id = None
        else:
            act = db.query(Activity).filter(Activity.id == int(aid), Activity.organization_id == org).first()
            if not act:
                raise HTTPException(status_code=404, detail="Activity not found")
            item.activity_id = int(aid)
    if "blocked_reason" in data:
        item.blocked_reason = data.get("blocked_reason")
    if "blocked_by" in data:
        item.blocked_by = data.get("blocked_by")
    if "owner_id" in data:
        if not can_manage_all:
            pass
        else:
            desired_owner_id = data.get("owner_id")
            if desired_owner_id is not None:
                exists = (
                    db.query(User)
                    .filter(User.id == int(desired_owner_id), User.organization_id == org)
                    .first()
                )
                if not exists:
                    raise HTTPException(status_code=400, detail="Owner user not found")
            item.owner_id = desired_owner_id

    db.add(item)
    db.commit()
    db.refresh(item)

    if create_version:
        try:
            latest = (
                db.query(ContentItemVersion)
                .filter(ContentItemVersion.item_id == item.id)
                .order_by(ContentItemVersion.version.desc())
                .first()
            )
            next_version = int(getattr(latest, "version", 0) or 0) + 1
            db.add(
                ContentItemVersion(
                    item_id=item.id,
                    version=next_version,
                    title=item.title,
                    brief=item.brief,
                    body=item.body,
                    meta={"status": str(item.status) if item.status is not None else None},
                    created_by=current_user.id,
                )
            )
            db.commit()
        except Exception:
            db.rollback()

    after = {
        "title": item.title,
        "channel": item.channel,
        "format": item.format,
        "status": str(item.status) if item.status is not None else None,
        "scheduled_at": item.scheduled_at.isoformat() if item.scheduled_at else None,
        "due_at": item.due_at.isoformat() if item.due_at else None,
    }
    if before != after:
        _audit(db, item_id=item.id, actor_id=current_user.id, action="content_item.updated", data={"before": before, "after": after})

    _sync_calendar_for_item(db, item=item, actor=current_user)
    db.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_content_item(
    item_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    can_manage_all = _can_manage_all(current_user)
    if not can_manage_all and item.owner_id not in (None, current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")

    db.delete(item)
    db.commit()
    return {"ok": True, "id": item_id}


# --- Reviewers ---


@router.get("/items/{item_id}/reviewers", response_model=List[ContentItemReviewerOut])
def list_reviewers(
    item_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    return db.query(ContentItemReviewer).filter(ContentItemReviewer.item_id == item.id).order_by(ContentItemReviewer.created_at.asc()).all()


@router.post("/items/{item_id}/reviewers", response_model=ContentItemReviewerOut)
def add_reviewer(
    item_id: int,
    payload: ContentItemReviewerCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    if not _can_manage_all(current_user):
        raise HTTPException(status_code=403, detail="Only admins/editors can manage reviewers")
    org = get_org_id(current_user)
    exists = db.query(User).filter(User.id == int(payload.reviewer_id), User.organization_id == org).first()
    if not exists:
        raise HTTPException(status_code=400, detail="Reviewer user not found")

    r = ContentItemReviewer(item_id=item.id, reviewer_id=payload.reviewer_id, role=payload.role)
    db.add(r)
    db.commit()
    db.refresh(r)
    _audit(db, item_id=item.id, actor_id=current_user.id, action="content_item.reviewer_added", data={"reviewer_id": payload.reviewer_id})
    return r


@router.delete("/reviewers/{reviewer_row_id}")
def remove_reviewer(
    reviewer_row_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    if not _can_manage_all(current_user):
        raise HTTPException(status_code=403, detail="Only admins/editors can manage reviewers")
    row = db.query(ContentItemReviewer).filter(ContentItemReviewer.id == reviewer_row_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Reviewer assignment not found")
    _require_item_access(db, item_id=row.item_id, user=current_user)
    item_id = row.item_id
    db.delete(row)
    db.commit()
    _audit(db, item_id=item_id, actor_id=current_user.id, action="content_item.reviewer_removed", data={"row_id": reviewer_row_id})
    return {"ok": True, "id": reviewer_row_id}


# --- Comments ---


@router.get("/items/{item_id}/comments", response_model=List[ContentItemCommentOut])
def list_comments(
    item_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    return (
        db.query(ContentItemComment)
        .filter(ContentItemComment.item_id == item.id)
        .order_by(ContentItemComment.created_at.asc())
        .all()
    )


@router.post("/items/{item_id}/comments", response_model=ContentItemCommentOut)
def add_comment(
    item_id: int,
    payload: ContentItemCommentCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    c = ContentItemComment(item_id=item.id, author_id=current_user.id, body=payload.body.strip())
    db.add(c)
    db.commit()
    db.refresh(c)
    _audit(db, item_id=item.id, actor_id=current_user.id, action="content_item.comment_added", data={"comment_id": c.id})
    return c


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    c = db.query(ContentItemComment).filter(ContentItemComment.id == comment_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    item = _require_item_access(db, item_id=c.item_id, user=current_user)
    can_manage_all = _can_manage_all(current_user)
    if not can_manage_all and c.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    db.delete(c)
    db.commit()
    _audit(db, item_id=item.id, actor_id=current_user.id, action="content_item.comment_deleted", data={"comment_id": comment_id})
    return {"ok": True, "id": comment_id}


# --- Checklist ---


@router.get("/items/{item_id}/checklist", response_model=List[ContentChecklistItemOut])
def list_checklist(
    item_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    return (
        db.query(ContentItemChecklistItem)
        .filter(ContentItemChecklistItem.item_id == item.id)
        .order_by(ContentItemChecklistItem.position.asc(), ContentItemChecklistItem.id.asc())
        .all()
    )


@router.post("/items/{item_id}/checklist", response_model=ContentChecklistItemOut)
def create_checklist_item(
    item_id: int,
    payload: ContentChecklistItemCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    row = ContentItemChecklistItem(item_id=item.id, title=payload.title.strip(), position=int(payload.position or 0))
    db.add(row)
    db.commit()
    db.refresh(row)
    _audit(db, item_id=item.id, actor_id=current_user.id, action="content_item.checklist_added", data={"checklist_id": row.id})
    return row


@router.patch("/checklist/{checklist_id}", response_model=ContentChecklistItemOut)
def update_checklist_item(
    checklist_id: int,
    payload: ContentChecklistItemUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    row = db.query(ContentItemChecklistItem).filter(ContentItemChecklistItem.id == checklist_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    _require_item_access(db, item_id=row.item_id, user=current_user)
    data = payload.model_dump(exclude_unset=True)
    if "title" in data and data["title"] is not None:
        row.title = data["title"].strip()
    if "is_done" in data and data["is_done"] is not None:
        row.is_done = bool(data["is_done"])
    if "position" in data and data["position"] is not None:
        row.position = int(data["position"])
    row.updated_at = datetime.utcnow()
    db.add(row)
    db.commit()
    db.refresh(row)
    _audit(db, item_id=row.item_id, actor_id=current_user.id, action="content_item.checklist_updated", data={"checklist_id": row.id})
    return row


@router.delete("/checklist/{checklist_id}")
def delete_checklist_item(
    checklist_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    row = db.query(ContentItemChecklistItem).filter(ContentItemChecklistItem.id == checklist_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    _require_item_access(db, item_id=row.item_id, user=current_user)
    item_id = row.item_id
    db.delete(row)
    db.commit()
    _audit(db, item_id=item_id, actor_id=current_user.id, action="content_item.checklist_deleted", data={"checklist_id": checklist_id})
    return {"ok": True, "id": checklist_id}


# --- Assets ---


@router.get("/items/{item_id}/assets", response_model=List[ContentAssetOut])
def list_assets(
    item_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    return db.query(ContentItemAsset).filter(ContentItemAsset.item_id == item.id).order_by(ContentItemAsset.created_at.desc()).all()


@router.post("/items/{item_id}/assets", response_model=ContentAssetOut)
def create_asset(
    item_id: int,
    payload: ContentAssetCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    org = get_org_id(current_user)
    can_manage_all = _can_manage_all(current_user)
    kind = payload.kind or ContentAssetKind.LINK
    if kind == ContentAssetKind.UPLOAD and not payload.upload_id:
        raise HTTPException(status_code=400, detail="upload_id is required for UPLOAD assets")
    if kind == ContentAssetKind.LINK and not (payload.url or "").strip():
        raise HTTPException(status_code=400, detail="url is required for LINK assets")

    upload: Optional[Upload] = None
    if payload.upload_id is not None:
        upload = (
            db.query(Upload)
            .filter(Upload.id == int(payload.upload_id), Upload.organization_id == org)
            .first()
        )
        if not upload:
            raise HTTPException(status_code=400, detail="Upload not found")
        # Prevent guessing someone else's upload_id inside the same org.
        if not can_manage_all and getattr(upload, "owner_id", None) not in (None, current_user.id):
            raise HTTPException(status_code=403, detail="Forbidden")

    a = ContentItemAsset(
        item_id=item.id,
        kind=kind,
        name=(payload.name or (upload.original_name if upload else None)),
        url=(payload.url.strip() if payload.url else None),
        upload_id=(int(payload.upload_id) if payload.upload_id is not None else None),
        source=(payload.source or None),
        mime_type=(upload.file_type if upload else None),
        size_bytes=(int(upload.file_size or 0) if upload else None),
        created_by=current_user.id,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    _audit(db, item_id=item.id, actor_id=current_user.id, action="content_item.asset_added", data={"asset_id": a.id})
    return a


@router.post("/items/{item_id}/assets/upload", response_model=ContentAssetOut)
def upload_asset(
    item_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    settings = get_settings()
    org = get_org_id(current_user)

    content = file.file.read() or b""
    if len(content) > settings.upload_max_bytes:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.upload_max_bytes} bytes).")

    upload = Upload(
        original_name=file.filename or "file",
        file_type=file.content_type or "application/octet-stream",
        file_size=len(content),
    )
    # Always store bytes for Content Hub assets (needed for preview)
    upload.content = content
    upload.stored_in_db = True
    upload.organization_id = org
    upload.owner_id = current_user.id
    db.add(upload)
    db.commit()
    db.refresh(upload)

    asset = ContentItemAsset(
        item_id=item.id,
        kind=ContentAssetKind.UPLOAD,
        name=upload.original_name,
        upload_id=upload.id,
        source="upload",
        mime_type=upload.file_type,
        size_bytes=int(upload.file_size or 0),
        created_by=current_user.id,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    _audit(db, item_id=item.id, actor_id=current_user.id, action="content_item.asset_uploaded", data={"asset_id": asset.id, "upload_id": upload.id})
    return asset


@router.patch("/assets/{asset_id}", response_model=ContentAssetOut)
def update_asset(
    asset_id: int,
    payload: ContentAssetUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    a = db.query(ContentItemAsset).filter(ContentItemAsset.id == asset_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")
    _require_item_access(db, item_id=a.item_id, user=current_user)

    data = payload.model_dump(exclude_unset=True)
    if "name" in data:
        a.name = data["name"].strip() if data["name"] else None
    if "url" in data:
        a.url = data["url"].strip() if data["url"] else None
    if "source" in data:
        a.source = data["source"].strip() if data["source"] else None
    if "version" in data and data["version"] is not None:
        a.version = max(1, int(data["version"]))
    db.add(a)
    db.commit()
    db.refresh(a)
    _audit(db, item_id=a.item_id, actor_id=current_user.id, action="content_item.asset_updated", data={"asset_id": a.id})
    return a


@router.delete("/assets/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    a = db.query(ContentItemAsset).filter(ContentItemAsset.id == asset_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")
    _require_item_access(db, item_id=a.item_id, user=current_user)
    item_id = a.item_id
    db.delete(a)
    db.commit()
    _audit(db, item_id=item_id, actor_id=current_user.id, action="content_item.asset_deleted", data={"asset_id": asset_id})
    return {"ok": True, "id": asset_id}


@router.get("/assets/{asset_id}/download")
def download_asset(
    asset_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    a = db.query(ContentItemAsset).filter(ContentItemAsset.id == asset_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")
    _require_item_access(db, item_id=a.item_id, user=current_user)
    org = get_org_id(current_user)

    if a.kind == ContentAssetKind.LINK:
        url = (a.url or "").strip()
        if not url:
            raise HTTPException(status_code=404, detail="No URL")
        # Safety: never redirect to non-http(s) schemes (javascript:, data:, file:, etc.)
        try:
            from urllib.parse import urlparse

            parsed = urlparse(url)
            if (parsed.scheme or "").lower() not in {"http", "https"}:
                raise HTTPException(status_code=400, detail="Unsupported URL scheme")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid URL")
        return RedirectResponse(url=url, status_code=302)

    if not a.upload_id:
        raise HTTPException(status_code=404, detail="No upload linked")
    upload = db.query(Upload).filter(Upload.id == int(a.upload_id), Upload.organization_id == org).first()
    if not upload or not getattr(upload, "content", None):
        raise HTTPException(status_code=404, detail="Upload content not found")

    def _safe_filename(name: str) -> str:
        s = (name or "").strip() or f"asset-{asset_id}"
        # Prevent header injection / weird control chars
        s = s.replace("\r", " ").replace("\n", " ").replace('"', "'")
        return s[:180]

    raw_type = (upload.file_type or "").strip().lower()
    name = _safe_filename(upload.original_name or f"asset-{asset_id}")

    # Active content risk: never serve HTML/SVG as inline-renderable types.
    unsafe_types = {
        "text/html",
        "application/xhtml+xml",
        "image/svg+xml",
        "text/xml",
        "application/xml",
    }
    media_type = "application/octet-stream" if raw_type in unsafe_types else (raw_type or "application/octet-stream")

    return Response(
        content=upload.content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{name}"',
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
            # Extra hardening in case a browser still tries to render:
            "Content-Security-Policy": "default-src 'none'; sandbox",
        },
    )


# --- Versions ---


@router.get("/items/{item_id}/versions", response_model=List[ContentVersionOut])
def list_versions(
    item_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    return (
        db.query(ContentItemVersion)
        .filter(ContentItemVersion.item_id == item.id)
        .order_by(ContentItemVersion.version.desc())
        .all()
    )


@router.post("/items/{item_id}/versions", response_model=ContentVersionOut)
def create_version(
    item_id: int,
    payload: ContentVersionCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    latest = (
        db.query(ContentItemVersion)
        .filter(ContentItemVersion.item_id == item.id)
        .order_by(ContentItemVersion.version.desc())
        .first()
    )
    next_version = int(getattr(latest, "version", 0) or 0) + 1
    v = ContentItemVersion(
        item_id=item.id,
        version=next_version,
        title=payload.title or item.title,
        brief=payload.brief if payload.brief is not None else item.brief,
        body=payload.body if payload.body is not None else item.body,
        meta=payload.meta or {"status": str(item.status) if item.status is not None else None},
        created_by=current_user.id,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    _audit(db, item_id=item.id, actor_id=current_user.id, action="content_item.version_created", data={"version_id": v.id, "version": v.version})
    return v


# --- Audit / history ---


@router.get("/items/{item_id}/audit", response_model=List[ContentAuditOut])
def list_audit(
    item_id: int,
    limit: int = 200,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    lim = max(1, min(500, int(limit)))
    return (
        db.query(ContentItemAuditLog)
        .filter(ContentItemAuditLog.item_id == item.id)
        .order_by(ContentItemAuditLog.created_at.desc())
        .limit(lim)
        .all()
    )


# --- Templates ---


@router.get("/templates", response_model=List[ContentTemplateOut])
def list_templates(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    # For now, templates are visible to everyone.
    org = get_org_id(current_user)
    return (
        db.query(ContentTemplate)
        .filter(ContentTemplate.organization_id == org)
        .order_by(ContentTemplate.updated_at.desc())
        .limit(200)
        .all()
    )


@router.post("/templates", response_model=ContentTemplateOut)
def create_template(
    payload: ContentTemplateCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    org = get_org_id(current_user)
    tpl = ContentTemplate(
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        channel=payload.channel.strip() if payload.channel else None,
        format=payload.format.strip() if payload.format else None,
        tags=_norm_tags(payload.tags),
        checklist=payload.checklist or None,
        tasks=payload.tasks or None,
        reviewers=payload.reviewers or None,
        created_by=current_user.id,
        organization_id=org,
    )
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.patch("/templates/{template_id}", response_model=ContentTemplateOut)
def update_template(
    template_id: int,
    payload: ContentTemplateUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    org = get_org_id(current_user)
    tpl = (
        db.query(ContentTemplate)
        .filter(ContentTemplate.id == template_id, ContentTemplate.organization_id == org)
        .first()
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        tpl.name = data["name"].strip()
    if "description" in data:
        tpl.description = data["description"].strip() if data["description"] else None
    if "channel" in data:
        tpl.channel = data["channel"].strip() if data["channel"] else None
    if "format" in data:
        tpl.format = data["format"].strip() if data["format"] else None
    if "tags" in data:
        tpl.tags = _norm_tags(data.get("tags"))
    if "checklist" in data:
        tpl.checklist = data.get("checklist") or None
    if "tasks" in data:
        tpl.tasks = data.get("tasks") or None
    if "reviewers" in data:
        tpl.reviewers = data.get("reviewers") or None
    tpl.updated_at = datetime.utcnow()
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    if not _can_manage_all(current_user):
        raise HTTPException(status_code=403, detail="Only admins/editors can delete templates")
    org = get_org_id(current_user)
    tpl = (
        db.query(ContentTemplate)
        .filter(ContentTemplate.id == template_id, ContentTemplate.organization_id == org)
        .first()
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(tpl)
    db.commit()
    return {"ok": True, "id": template_id}


@router.post("/items/{item_id}/apply-template")
def apply_template(
    item_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    item = _require_item_access(db, item_id=item_id, user=current_user)
    org = get_org_id(current_user)
    template_id = payload.get("template_id")
    if template_id is None:
        raise HTTPException(status_code=400, detail="template_id is required")
    tpl = (
        db.query(ContentTemplate)
        .filter(ContentTemplate.id == int(template_id), ContentTemplate.organization_id == org)
        .first()
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")

    created = {"checklist": 0, "tasks": 0, "reviewers": 0}

    # Checklist items
    checklist = tpl.checklist if isinstance(tpl.checklist, list) else []
    if checklist:
        # keep existing order stable by appending after max position
        existing_max = (
            db.query(ContentItemChecklistItem)
            .filter(ContentItemChecklistItem.item_id == item.id)
            .order_by(ContentItemChecklistItem.position.desc())
            .first()
        )
        base_pos = int(getattr(existing_max, "position", 0) or 0) + 1
        for idx, title in enumerate(checklist):
            s = str(title or "").strip()
            if not s:
                continue
            db.add(ContentItemChecklistItem(item_id=item.id, title=s, position=base_pos + idx))
            created["checklist"] += 1

    # Reviewer assignments
    reviewers = tpl.reviewers if isinstance(tpl.reviewers, list) else []
    if reviewers and _can_manage_all(current_user):
        for uid in reviewers:
            try:
                rid = int(uid)
            except Exception:
                continue
            exists = db.query(User).filter(User.id == rid, User.organization_id == org).first()
            if not exists:
                continue
            db.add(ContentItemReviewer(item_id=item.id, reviewer_id=rid, role="reviewer"))
            created["reviewers"] += 1

    # Task templates
    tasks_tpl = tpl.tasks if isinstance(tpl.tasks, list) else []
    now = _now_utc()
    for row in tasks_tpl:
        if not isinstance(row, dict):
            continue
        title = str(row.get("title") or "").strip()
        if not title:
            continue
        status = row.get("status") or ContentTaskStatus.TODO
        priority = row.get("priority") or ContentTaskPriority.MEDIUM
        try:
            offset_days = int(row.get("offset_days") or 0)
        except Exception:
            offset_days = 0
        deadline = now + timedelta(days=offset_days) if offset_days else None
        recurrence = row.get("recurrence") if isinstance(row.get("recurrence"), dict) else None
        db.add(
            ContentTask(
                title=title,
                channel=(tpl.channel or item.channel or "Website"),
                format=(tpl.format or item.format),
                status=status,
                priority=priority,
                notes=str(row.get("notes") or "").strip() or None,
                deadline=deadline,
                activity_id=item.activity_id,
                content_item_id=item.id,
                recurrence=recurrence,
                owner_id=item.owner_id,
                organization_id=org,
            )
        )
        created["tasks"] += 1

    db.commit()
    _audit(db, item_id=item.id, actor_id=current_user.id, action="content_item.template_applied", data={"template_id": tpl.id, "created": created})
    return {"ok": True, "template_id": tpl.id, "created": created}


# --- Automation rules ---


@router.get("/automation-rules", response_model=List[ContentAutomationRuleOut])
def list_automation_rules(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    if not _can_manage_all(current_user):
        return []
    org = get_org_id(current_user)
    return (
        db.query(ContentAutomationRule)
        .filter(ContentAutomationRule.organization_id == org)
        .order_by(ContentAutomationRule.updated_at.desc())
        .limit(200)
        .all()
    )


@router.post("/automation-rules", response_model=ContentAutomationRuleOut)
def create_automation_rule(
    payload: ContentAutomationRuleCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    if not _can_manage_all(current_user):
        raise HTTPException(status_code=403, detail="Only admins/editors can manage automation rules")
    org = get_org_id(current_user)
    if payload.template_id is not None:
        tpl = db.query(ContentTemplate).filter(ContentTemplate.id == int(payload.template_id), ContentTemplate.organization_id == org).first()
        if not tpl:
            raise HTTPException(status_code=400, detail="Template not found")
    rule = ContentAutomationRule(
        name=payload.name.strip(),
        is_active=bool(payload.is_active),
        trigger=payload.trigger.strip(),
        template_id=payload.template_id,
        config=payload.config or None,
        created_by=current_user.id,
        organization_id=org,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.patch("/automation-rules/{rule_id}", response_model=ContentAutomationRuleOut)
def update_automation_rule(
    rule_id: int,
    payload: ContentAutomationRuleUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    if not _can_manage_all(current_user):
        raise HTTPException(status_code=403, detail="Only admins/editors can manage automation rules")
    org = get_org_id(current_user)
    rule = (
        db.query(ContentAutomationRule)
        .filter(ContentAutomationRule.id == rule_id, ContentAutomationRule.organization_id == org)
        .first()
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        rule.name = data["name"].strip()
    if "is_active" in data and data["is_active"] is not None:
        rule.is_active = bool(data["is_active"])
    if "trigger" in data and data["trigger"]:
        rule.trigger = data["trigger"].strip()
    if "template_id" in data:
        tid = data.get("template_id")
        if tid is None:
            rule.template_id = None
        else:
            tpl = db.query(ContentTemplate).filter(ContentTemplate.id == int(tid), ContentTemplate.organization_id == org).first()
            if not tpl:
                raise HTTPException(status_code=400, detail="Template not found")
            rule.template_id = int(tid)
    if "config" in data:
        rule.config = data.get("config") or None
    rule.updated_at = datetime.utcnow()
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/automation-rules/{rule_id}")
def delete_automation_rule(
    rule_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    if not _can_manage_all(current_user):
        raise HTTPException(status_code=403, detail="Only admins/editors can manage automation rules")
    org = get_org_id(current_user)
    rule = (
        db.query(ContentAutomationRule)
        .filter(ContentAutomationRule.id == rule_id, ContentAutomationRule.organization_id == org)
        .first()
    )
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    db.delete(rule)
    db.commit()
    return {"ok": True, "id": rule_id}


# --- Automation execution ---


@router.post("/generate/from-deal/{deal_id}")
def generate_from_deal(
    deal_id: int,
    payload: Dict[str, Any],
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """
    Create a content item + tasks/checklist based on a template, linked to a deal.
    Intended for "deal won → create content package".
    """
    org = get_org_id(current_user)
    template_id = payload.get("template_id")
    tpl: Optional[ContentTemplate] = None
    if template_id is not None:
        tpl = (
            db.query(ContentTemplate)
            .filter(ContentTemplate.id == int(template_id), ContentTemplate.organization_id == org)
            .first()
        )
        if not tpl:
            raise HTTPException(status_code=404, detail="Template not found")
    else:
        # fallback: first template (if any)
        tpl = (
            db.query(ContentTemplate)
            .filter(ContentTemplate.organization_id == org)
            .order_by(ContentTemplate.updated_at.desc())
            .first()
        )

    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.organization_id == org).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    title = payload.get("title") or (f"{deal.title} — Content Pack")
    item = ContentItem(
        title=str(title).strip() or f"Deal {deal.id} — Content Pack",
        channel=(tpl.channel if tpl and tpl.channel else "Website"),
        format=(tpl.format if tpl and tpl.format else None),
        status=ContentItemStatus.DRAFT,
        tags=_norm_tags(payload.get("tags") or (tpl.tags if tpl else None)),
        brief=payload.get("brief") or None,
        body=payload.get("body") or None,
        tone=payload.get("tone") or None,
        language=payload.get("language") or "de",
        company_id=getattr(deal, "company_id", None),
        project_id=deal.id,
        owner_id=current_user.id,
        organization_id=org,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    _audit(db, item_id=item.id, actor_id=current_user.id, action="content_item.generated_from_deal", data={"deal_id": deal_id, "template_id": tpl.id if tpl else None})

    if tpl:
        apply_template(item.id, {"template_id": tpl.id}, db=db, current_user=current_user)  # type: ignore

    return {"ok": True, "item_id": item.id, "template_id": tpl.id if tpl else None}


# --- Notifications ---


@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    org = get_org_id(current_user)
    q = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.organization_id == org)
    if unread_only:
        q = q.filter(Notification.read_at.is_(None))
    return q.order_by(Notification.created_at.desc()).limit(max(1, min(200, int(limit)))).all()


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    org = get_org_id(current_user)
    n = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id, Notification.organization_id == org)
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    if n.read_at is None:
        n.read_at = _now_utc()
        db.add(n)
        db.commit()
    return {"ok": True, "id": notification_id}


@router.post("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    now = _now_utc()
    org = get_org_id(current_user)
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.organization_id == org,
        Notification.read_at.is_(None),
    ).update({"read_at": now})
    db.commit()
    return {"ok": True}


@router.post("/reminders/run")
def run_reminders(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create in-app notifications for upcoming deadlines / scheduled publications.

    This endpoint is safe to call repeatedly (best-effort de-duplication via dedupe_key).
    Recommended: call via cron (Render) every 10-30 minutes.
    """
    if not _can_manage_all(current_user):
        raise HTTPException(status_code=403, detail="Only admins/editors can run reminders")

    now = _now_utc()
    horizon = now + timedelta(hours=24)
    created = 0
    org = get_org_id(current_user)

    def _create_notification(user_id: int, *, dedupe_key: str, title: str, body: str, url: str) -> None:
        nonlocal created
        if not dedupe_key:
            return
        exists = db.query(Notification).filter(Notification.dedupe_key == dedupe_key, Notification.organization_id == org).first()
        if exists:
            return
        db.add(
            Notification(
                user_id=user_id,
                organization_id=org,
                type="reminder",
                title=title,
                body=body,
                url=url,
                dedupe_key=dedupe_key,
            )
        )
        created += 1

    # Content item scheduled publications
    items = (
        db.query(ContentItem)
        .filter(
            ContentItem.organization_id == org,
            ContentItem.scheduled_at.is_not(None),
            ContentItem.scheduled_at <= horizon,
            ContentItem.scheduled_at >= now,
        )
        .all()
    )
    for it in items:
        uid = it.owner_id
        if uid is None:
            continue
        dedupe = f"content_item:schedule:{it.id}:{it.scheduled_at.isoformat()}"
        _create_notification(
            uid,
            dedupe_key=dedupe,
            title="Geplante Veröffentlichung",
            body=f"'{it.title}' ist geplant für {it.scheduled_at.strftime('%Y-%m-%d %H:%M')}.",
            url=f"/content?item={it.id}",
        )

    # Task deadlines
    tasks = (
        db.query(ContentTask)
        .filter(
            ContentTask.organization_id == org,
            ContentTask.deadline.is_not(None),
            ContentTask.deadline <= horizon,
            ContentTask.deadline >= now,
        )
        .all()
    )
    for t in tasks:
        uid = t.owner_id
        if uid is None:
            continue
        dedupe = f"content_task:deadline:{t.id}:{t.deadline.isoformat()}"
        _create_notification(
            uid,
            dedupe_key=dedupe,
            title="Task Deadline",
            body=f"'{t.title}' ist fällig bis {t.deadline.strftime('%Y-%m-%d %H:%M')}.",
            url="/content",
        )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create reminders")

    return {"ok": True, "created": created}


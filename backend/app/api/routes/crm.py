from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict

from app.db.session import get_db_session
from app.models.calendar import CalendarEntry
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.content_item import ContentAutomationRule, ContentItem, ContentItemStatus, ContentTemplate, Notification
from app.models.user import User, UserRole
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyOut
from app.schemas.contact import ContactCreate, ContactUpdate, ContactOut
from app.schemas.deal import DealCreate, DealUpdate, DealOut
from app.schemas.user import UserOut
from app.api.deps import get_current_user, is_demo_user, require_writable_user
from app.demo import DEMO_SEED_SOURCE


router = APIRouter(prefix="/crm", tags=["crm"])

def _org_id(user: User) -> int:
    # Backward-compatible default for older DBs; migration backfills to 1.
    return int(getattr(user, "organization_id", None) or 1)


def _normalize_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _normalize_email(value: Any) -> Optional[str]:
    text = _normalize_text(value)
    return text.lower() if text else None


def _normalize_name(value: Any) -> Optional[str]:
    text = _normalize_text(value)
    if not text:
        return None
    return " ".join(text.split())


def _company_norm_expr():
    return func.lower(func.btrim(Company.name))


def _email_norm_expr(column):
    return func.lower(func.btrim(column))


def _get_company_or_404(db: Session, org: int, company_id: int) -> Company:
    company = db.query(Company).filter(Company.id == company_id, Company.organization_id == org).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


def _get_contact_or_404(db: Session, org: int, contact_id: int) -> Contact:
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.organization_id == org).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


def _get_project_or_404(db: Session, org: int, project_id: int) -> Deal:
    project = db.query(Deal).filter(Deal.id == project_id, Deal.organization_id == org).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _commit_or_conflict(db: Session, detail: str) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=detail) from exc


def _resolve_owner_fields(
    db: Session,
    org: int,
    *,
    owner: Optional[str],
    owner_id: Optional[int],
) -> tuple[Optional[str], Optional[int]]:
    normalized_owner = _normalize_email(owner) or _normalize_name(owner)
    resolved_owner_id = owner_id
    owner_user: Optional[User] = None

    if owner_id is not None:
        owner_user = (
            db.query(User)
            .filter(User.id == int(owner_id), User.organization_id == org)
            .first()
        )
        if not owner_user:
            raise HTTPException(status_code=404, detail="Owner not found")
        resolved_owner_id = owner_user.id
        if not normalized_owner:
            normalized_owner = _normalize_email(owner_user.email) or owner_user.email
    elif normalized_owner:
        owner_user = (
            db.query(User)
            .filter(
                User.organization_id == org,
                _email_norm_expr(User.email) == normalized_owner.lower(),
            )
            .first()
        )
        if owner_user:
            resolved_owner_id = owner_user.id
            normalized_owner = _normalize_email(owner_user.email) or owner_user.email

    return normalized_owner, resolved_owner_id


def _find_duplicate_companies(
    db: Session,
    org: int,
    *,
    name: Optional[str] = None,
    email: Optional[str] = None,
    exclude_id: Optional[int] = None,
) -> List[Company]:
    matches: List[Company] = []
    seen_ids: set[int] = set()
    normalized_name = _normalize_name(name)
    normalized_email = _normalize_email(email)

    if normalized_name:
        q = db.query(Company).filter(
            Company.organization_id == org,
            _company_norm_expr() == normalized_name.lower(),
        )
        if exclude_id is not None:
            q = q.filter(Company.id != exclude_id)
        for company in q.order_by(Company.id.asc()).all():
            if company.id not in seen_ids:
                matches.append(company)
                seen_ids.add(company.id)

    if normalized_email:
        q = db.query(Company).filter(
            Company.organization_id == org,
            Company.email.isnot(None),
            _email_norm_expr(Company.email) == normalized_email,
        )
        if exclude_id is not None:
            q = q.filter(Company.id != exclude_id)
        for company in q.order_by(Company.id.asc()).all():
            if company.id not in seen_ids:
                matches.append(company)
                seen_ids.add(company.id)

    return matches


def _find_duplicate_contacts(
    db: Session,
    org: int,
    *,
    email: Optional[str] = None,
    exclude_id: Optional[int] = None,
) -> List[Contact]:
    normalized_email = _normalize_email(email)
    if not normalized_email:
        return []

    q = db.query(Contact).filter(
        Contact.organization_id == org,
        Contact.email.isnot(None),
        _email_norm_expr(Contact.email) == normalized_email,
    )
    if exclude_id is not None:
        q = q.filter(Contact.id != exclude_id)
    return q.order_by(Contact.id.asc()).all()


def _find_duplicate_projects(
    db: Session,
    org: int,
    *,
    title: Optional[str] = None,
    company_id: Optional[int] = None,
    exclude_id: Optional[int] = None,
) -> List[Deal]:
    normalized_title = _normalize_name(title)
    if not normalized_title or company_id is None:
        return []

    q = db.query(Deal).filter(
        Deal.organization_id == org,
        Deal.company_id == int(company_id),
        func.lower(func.btrim(Deal.title)) == normalized_title.lower(),
    )
    if exclude_id is not None:
        q = q.filter(Deal.id != exclude_id)
    return q.order_by(Deal.id.asc()).all()


@router.get("/duplicate-check")
def duplicate_check(
    entity: str = Query(..., regex="^(company|contact|project)$"),
    name: Optional[str] = None,
    email: Optional[str] = None,
    title: Optional[str] = None,
    company_id: Optional[int] = None,
    exclude_id: Optional[int] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    org = _org_id(current_user)

    if entity == "company":
        matches = _find_duplicate_companies(db, org, name=name, email=email, exclude_id=exclude_id)
        return {
            "entity": entity,
            "has_duplicates": bool(matches),
            "matches": [
                {
                    "id": company.id,
                    "label": company.name,
                    "email": company.email,
                    "reason": "name_or_email_match",
                }
                for company in matches
            ],
        }

    if entity == "contact":
        matches = _find_duplicate_contacts(db, org, email=email, exclude_id=exclude_id)
        return {
            "entity": entity,
            "has_duplicates": bool(matches),
            "matches": [
                {
                    "id": contact.id,
                    "label": contact.name,
                    "email": contact.email,
                    "company_id": contact.company_id,
                    "reason": "email_match",
                }
                for contact in matches
            ],
        }

    matches = _find_duplicate_projects(
        db,
        org,
        title=title,
        company_id=company_id,
        exclude_id=exclude_id,
    )
    return {
        "entity": entity,
        "has_duplicates": bool(matches),
        "matches": [
            {
                "id": project.id,
                "label": project.title,
                "company_id": project.company_id,
                "stage": project.stage,
                "reason": "same_company_title",
            }
            for project in matches
        ],
    }


@router.get("/companies", response_model=List[CompanyOut])
def list_companies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Company)
    q = q.filter(Company.organization_id == _org_id(current_user))
    if is_demo_user(current_user):
        q = q.filter(Company.lead_source == DEMO_SEED_SOURCE)
    return q.offset(skip).limit(limit).all()


@router.get("/companies/{company_id}", response_model=CompanyOut)
def get_company(
    company_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    return _get_company_or_404(db, _org_id(current_user), company_id)


@router.get("/contacts", response_model=List[ContactOut])
def list_contacts(
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Contact)
    q = q.filter(Contact.organization_id == _org_id(current_user))
    if is_demo_user(current_user):
        q = q.join(Company, Company.id == Contact.company_id).filter(Company.lead_source == DEMO_SEED_SOURCE)
    if company_id:
        q = q.filter(Contact.company_id == company_id)
    return q.offset(skip).limit(limit).all()


@router.get("/contacts/{contact_id}", response_model=ContactOut)
def get_contact(
    contact_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    return _get_contact_or_404(db, _org_id(current_user), contact_id)


@router.get("/deals", response_model=List[DealOut])
def list_deals(
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    stage: Optional[str] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Deal)
    q = q.filter(Deal.organization_id == _org_id(current_user))
    if is_demo_user(current_user):
        q = q.join(Company, Company.id == Deal.company_id).filter(Company.lead_source == DEMO_SEED_SOURCE)
    if company_id:
        q = q.filter(Deal.company_id == company_id)
    if stage:
        q = q.filter(Deal.stage == stage)
    return q.offset(skip).limit(limit).all()


@router.get("/deals/{deal_id}", response_model=DealOut)
def get_deal(
    deal_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.organization_id == _org_id(current_user)).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Project not found")
    return deal


def _to_float(value: Any) -> float:
    try:
        return float(value or 0)
    except Exception:
        return 0.0


def _stage(deal: Deal) -> str:
    return (getattr(deal, "stage", "") or "").lower()


@router.get("/stats")
def get_crm_stats(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Aggregated CRM stats for dashboard tiles.

    - totalCompanies / totalContacts / totalDeals: простые счётчики
    - pipelineValue: сумма value по незакрытым сделкам (stage != 'lost')
    - wonValue: сумма value по выигранным сделкам (stage == 'won')
    - conversionRate: доля выигранных сделок от всех (в процентах)
    """
    if is_demo_user(current_user):
        org = _org_id(current_user)
        total_companies = (
            db.query(Company)
            .filter(Company.lead_source == DEMO_SEED_SOURCE, Company.organization_id == org)
            .count()
        )
        total_contacts = (
            db.query(Contact)
            .join(Company, Company.id == Contact.company_id)
            .filter(Company.lead_source == DEMO_SEED_SOURCE, Company.organization_id == org)
            .count()
        )
        deals: List[Deal] = (
            db.query(Deal)
            .join(Company, Company.id == Deal.company_id)
            .filter(Company.lead_source == DEMO_SEED_SOURCE, Company.organization_id == org)
            .all()
        )
    else:
        org = _org_id(current_user)
        total_companies = db.query(Company).filter(Company.organization_id == org).count()
        total_contacts = db.query(Contact).filter(Contact.organization_id == org).count()
        deals = db.query(Deal).filter(Deal.organization_id == org).all()
    total_deals = len(deals)

    active_projects = [d for d in deals if _stage(d) not in ("won", "lost")]
    won_deals = [d for d in deals if _stage(d) == "won"]

    pipeline_value = sum(_to_float(d.value) for d in active_projects)
    won_value = sum(_to_float(d.value) for d in won_deals)
    conversion_rate = (len(won_deals) / total_deals * 100.0) if total_deals > 0 else 0.0

    return {
        "totalCompanies": total_companies,
        "totalContacts": total_contacts,
        "totalDeals": total_deals,
        "totalProjects": total_deals,
        "activeDeals": len(active_projects),
        "activeProjects": len(active_projects),
        "wonDeals": len(won_deals),
        "wonProjects": len(won_deals),
        "pipelineValue": pipeline_value,
        "wonValue": won_value,
        "conversionRate": conversion_rate,
    }


@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> List[User]:
    """
    Production‑ready endpoint used by CRM/Calendar для выпадающих списков пользователей.

    Возвращает упорядоченный список всех пользователей без паролей.
    """
    if is_demo_user(current_user):
        # Avoid leaking other real users in demo mode.
        return db.query(User).filter(User.id == current_user.id).all()
    # Multi-tenant: only users from the same organization (privacy-safe).
    return (
        db.query(User)
        .filter(User.organization_id == _org_id(current_user))
        .order_by(User.id.asc())
        .all()
    )


@router.get("/projects", response_model=List[DealOut])
def list_projects(
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> List[Deal]:
    """
    Production‑ready endpoint, который переиспользует CRM сделки как "проекты".

    - Используется календарём для поля "Projekt"
    - Возвращает те же объекты, что и /crm/deals (DealOut), чтобы фронтенд мог
      брать id и title.
    """
    q = db.query(Deal)
    q = q.filter(Deal.organization_id == _org_id(current_user))
    if is_demo_user(current_user):
        q = q.join(Company, Company.id == Deal.company_id).filter(Company.lead_source == DEMO_SEED_SOURCE)
    if company_id:
        q = q.filter(Deal.company_id == company_id)
    # По умолчанию не фильтруем по стадии, чтобы можно было привязать событие к любому deal
    return q.offset(skip).limit(limit).all()


@router.get("/projects/{project_id}", response_model=DealOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    return get_deal(project_id, db=db, current_user=current_user)


@router.post("/companies", response_model=CompanyOut)
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    org = _org_id(current_user)
    data = company.dict()
    data["name"] = _normalize_name(data.get("name"))
    data["email"] = _normalize_email(data.get("email"))
    data["contact_person_email"] = _normalize_email(data.get("contact_person_email"))
    duplicates = _find_duplicate_companies(db, org, name=data.get("name"), email=data.get("email"))
    if duplicates:
        raise HTTPException(status_code=409, detail="A company with the same name or email already exists")
    data["organization_id"] = _org_id(current_user)
    db_company = Company(**data)
    db.add(db_company)
    _commit_or_conflict(db, "A company with the same name or email already exists")
    db.refresh(db_company)
    return db_company


@router.put("/companies/{company_id}", response_model=CompanyOut)
def update_company(
    company_id: int,
    payload: CompanyUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """
    Частичное обновление компании.

    Используется CRM‑формой при редактировании компании.
    """
    company = (
        db.query(Company)
        .filter(Company.id == company_id, Company.organization_id == _org_id(current_user))
        .first()
    )
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    data = payload.dict(exclude_unset=True)
    if "name" in data:
        data["name"] = _normalize_name(data.get("name"))
    if "email" in data:
        data["email"] = _normalize_email(data.get("email"))
    if "contact_person_email" in data:
        data["contact_person_email"] = _normalize_email(data.get("contact_person_email"))

    duplicates = _find_duplicate_companies(
        db,
        _org_id(current_user),
        name=data.get("name", company.name),
        email=data.get("email", company.email),
        exclude_id=company.id,
    )
    if duplicates:
        raise HTTPException(status_code=409, detail="A company with the same name or email already exists")

    for field, value in data.items():
        # просто обновляем известные поля; схема уже отфильтровала лишнее
        setattr(company, field, value)

    db.add(company)
    _commit_or_conflict(db, "A company with the same name or email already exists")
    db.refresh(company)
    return company


@router.delete("/companies/{company_id}")
def delete_company(
    company_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    org = _org_id(current_user)
    company = _get_company_or_404(db, org, company_id)

    linked_contacts = db.query(Contact).filter(Contact.organization_id == org, Contact.company_id == company.id).count()
    linked_projects = db.query(Deal).filter(Deal.organization_id == org, Deal.company_id == company.id).count()
    linked_events = db.query(CalendarEntry).filter(CalendarEntry.organization_id == org, CalendarEntry.company_id == company.id).count()
    linked_content = db.query(ContentItem).filter(ContentItem.organization_id == org, ContentItem.company_id == company.id).count()

    if any((linked_contacts, linked_projects, linked_events, linked_content)):
        raise HTTPException(
            status_code=409,
            detail=(
                "Company is still referenced and cannot be deleted yet. "
                f"contacts={linked_contacts}, projects={linked_projects}, events={linked_events}, content_items={linked_content}"
            ),
        )

    db.delete(company)
    db.commit()
    return {"ok": True, "id": company_id}


@router.post("/contacts", response_model=ContactOut)
def create_contact(
    contact: ContactCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    org = _org_id(current_user)
    # Convert first_name + last_name to single name field
    contact_data = contact.dict()
    if 'first_name' in contact_data and 'last_name' in contact_data:
        contact_data['name'] = f"{contact_data['first_name']} {contact_data['last_name']}"
        del contact_data['first_name']
        del contact_data['last_name']

    # Filter out fields that don't exist in the Contact model
    valid_fields = {'company_id', 'name', 'email', 'phone', 'position'}
    contact_data = {k: v for k, v in contact_data.items() if k in valid_fields}

    company_id = contact_data.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="Contact must belong to a company")
    _get_company_or_404(db, org, int(company_id))

    contact_data["name"] = _normalize_name(contact_data.get("name"))
    contact_data["email"] = _normalize_email(contact_data.get("email"))
    if contact_data.get("email") and _find_duplicate_contacts(db, org, email=contact_data["email"]):
        raise HTTPException(status_code=409, detail="A contact with this email already exists")

    contact_data["organization_id"] = org
    db_contact = Contact(**contact_data)
    db.add(db_contact)
    _commit_or_conflict(db, "A contact with this email already exists")
    db.refresh(db_contact)
    return db_contact


@router.put("/contacts/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: int,
    payload: ContactUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """
    Частичное обновление контакта.

    UI работает с полем name, поэтому first_name/last_name мапим обратно в одно поле.
    """
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.organization_id == _org_id(current_user))
        .first()
    )
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    org = _org_id(current_user)
    data = payload.dict(exclude_unset=True)
    if "company_id" in data:
        if not data.get("company_id"):
            raise HTTPException(status_code=400, detail="Contact must belong to a company")
        _get_company_or_404(db, org, int(data["company_id"]))

    # Сконструировать полное имя из first_name / last_name, если они переданы
    first = data.pop("first_name", None)
    last = data.pop("last_name", None)
    if first is not None or last is not None:
        fname = (first or "").strip()
        lname = (last or "").strip()
        full = f"{fname} {lname}".strip() or fname or lname
        if full:
            contact.name = _normalize_name(full) or contact.name

    if "email" in data:
        data["email"] = _normalize_email(data.get("email"))
        if data["email"] and _find_duplicate_contacts(db, org, email=data["email"], exclude_id=contact.id):
            raise HTTPException(status_code=409, detail="A contact with this email already exists")

    for field, value in data.items():
        if hasattr(contact, field):
            setattr(contact, field, value)

    db.add(contact)
    _commit_or_conflict(db, "A contact with this email already exists")
    db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}")
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    org = _org_id(current_user)
    contact = _get_contact_or_404(db, org, contact_id)
    db.query(Deal).filter(Deal.organization_id == org, Deal.contact_id == contact.id).update(
        {Deal.contact_id: None},
        synchronize_session=False,
    )
    db.delete(contact)
    db.commit()
    return {"ok": True, "id": contact_id}


@router.post("/deals", response_model=DealOut)
def create_deal(
    deal: DealCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    org = _org_id(current_user)
    data = deal.dict()
    data["organization_id"] = org
    data["title"] = _normalize_name(data.get("title"))
    data["owner"] = _normalize_email(data.get("owner")) or _normalize_name(data.get("owner"))

    # Multi-tenant safety: validate foreign keys belong to the same org.
    company_id = data.get("company_id")
    contact_id = data.get("contact_id")
    company = None
    contact = None
    if company_id:
        company = _get_company_or_404(db, org, int(company_id))
    if contact_id:
        contact = _get_contact_or_404(db, org, int(contact_id))
        # If company isn't provided, derive it from the contact to keep the graph consistent.
        if not company_id and getattr(contact, "company_id", None):
            data["company_id"] = int(contact.company_id)  # type: ignore[arg-type]
            company_id = data.get("company_id")
            company = _get_company_or_404(db, org, int(company_id))
        if company_id and getattr(contact, "company_id", None) and int(contact.company_id) != int(company_id):  # type: ignore[arg-type]
            raise HTTPException(status_code=400, detail="Contact does not belong to company")

    if not company_id:
        raise HTTPException(status_code=400, detail="Project must belong to a company")

    resolved_owner, resolved_owner_id = _resolve_owner_fields(
        db,
        org,
        owner=data.get("owner"),
        owner_id=data.get("owner_id"),
    )
    if not resolved_owner:
        raise HTTPException(status_code=400, detail="Project owner is required")
    data["owner"] = resolved_owner
    data["owner_id"] = resolved_owner_id

    db_deal = Deal(**data)
    db.add(db_deal)
    _commit_or_conflict(db, "Project could not be saved")
    db.refresh(db_deal)

    # Automation hook: if deal starts as WON, create content package(s)
    try:
        if (db_deal.stage or "").lower() == "won":
            _run_deal_won_automation(db, db_deal, current_user)
    except Exception:
        db.rollback()

    return db_deal


def _run_deal_won_automation(db: Session, deal: Deal, actor: User) -> None:
    """
    Execute active automation rules for trigger 'deal_won'.
    Creates content items linked to the deal and applies templates.
    """
    org = int(getattr(deal, "organization_id", None) or _org_id(actor))
    rules = (
        db.query(ContentAutomationRule)
        .filter(
            ContentAutomationRule.trigger == "deal_won",
            ContentAutomationRule.is_active.is_(True),
            ContentAutomationRule.organization_id == org,
        )
        .order_by(ContentAutomationRule.updated_at.desc())
        .all()
    )
    if not rules:
        return

    for rule in rules:
        tpl: Optional[ContentTemplate] = None
        if getattr(rule, "template_id", None):
            tpl = (
                db.query(ContentTemplate)
                .filter(ContentTemplate.id == int(rule.template_id), ContentTemplate.organization_id == org)
                .first()
            )
        if not tpl:
            continue

        title = f"{deal.title} — {tpl.name}"
        existing = (
            db.query(ContentItem)
            .filter(
                ContentItem.project_id == deal.id,
                ContentItem.title == title,
                ContentItem.owner_id == actor.id,
                ContentItem.organization_id == org,
            )
            .first()
        )
        if existing:
            continue

        item = ContentItem(
            title=title,
            channel=(tpl.channel or "Website"),
            format=(tpl.format or None),
            status=ContentItemStatus.DRAFT,
            tags=(tpl.tags or ["auto:deal_won"]),
            brief=(tpl.description or None),
            company_id=getattr(deal, "company_id", None),
            project_id=deal.id,
            owner_id=actor.id,
            organization_id=org,
        )
        db.add(item)
        db.commit()
        db.refresh(item)

        # Apply template (creates checklist + tasks)
        try:
            from app.api.routes.content_items import apply_template as _apply_template  # local import to avoid cycles

            _apply_template(item.id, {"template_id": tpl.id}, db=db, current_user=actor)  # type: ignore
        except Exception:
            db.rollback()

        # Notify owner
        try:
            db.add(
                Notification(
                    user_id=actor.id,
                    organization_id=org,
                    type="info",
                    title="Content Pack erstellt",
                    body=f"Für Deal '{deal.title}' wurde '{tpl.name}' angelegt.",
                    url=f"/content?item={item.id}",
                    dedupe_key=f"deal_won:{deal.id}:rule:{rule.id}",
                )
            )
            db.commit()
        except Exception:
            db.rollback()


@router.put("/deals/{deal_id}", response_model=DealOut)
def update_deal(
    deal_id: int,
    payload: DealUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    deal = (
        db.query(Deal)
        .filter(Deal.id == deal_id, Deal.organization_id == _org_id(current_user))
        .first()
    )
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    prev_stage = (deal.stage or "").lower()

    org = _org_id(current_user)
    data = payload.dict(exclude_unset=True)
    if "title" in data:
        data["title"] = _normalize_name(data.get("title"))
    if "owner" in data:
        data["owner"] = _normalize_email(data.get("owner")) or _normalize_name(data.get("owner"))

    # Multi-tenant safety: validate FK updates belong to the same org.
    if "company_id" in data:
        if not data.get("company_id"):
            raise HTTPException(status_code=400, detail="Project must belong to a company")
        _get_company_or_404(db, org, int(data["company_id"]))
    if "contact_id" in data and data.get("contact_id"):
        _get_contact_or_404(db, org, int(data["contact_id"]))

    # Consistency check: if both are set (either already on deal or in payload),
    # ensure contact belongs to the selected company.
    next_company_raw = data["company_id"] if "company_id" in data else getattr(deal, "company_id", None)
    next_contact_raw = data["contact_id"] if "contact_id" in data else getattr(deal, "contact_id", None)
    next_company_id = int(next_company_raw or 0)
    next_contact_id = int(next_contact_raw or 0)
    if not next_company_id:
        raise HTTPException(status_code=400, detail="Project must belong to a company")
    if next_company_id and next_contact_id:
        contact = _get_contact_or_404(db, org, next_contact_id)
        if getattr(contact, "company_id", None) and int(contact.company_id) != next_company_id:  # type: ignore[arg-type]
            raise HTTPException(status_code=400, detail="Contact does not belong to company")
    elif next_contact_id and not data.get("company_id") and getattr(deal, "company_id", None) is None:
        contact = _get_contact_or_404(db, org, next_contact_id)
        data["company_id"] = int(contact.company_id)

    if "owner" in data or "owner_id" in data:
        resolved_owner, resolved_owner_id = _resolve_owner_fields(
            db,
            org,
            owner=data.get("owner", deal.owner),
            owner_id=data.get("owner_id", getattr(deal, "owner_id", None)),
        )
        if not resolved_owner:
            raise HTTPException(status_code=400, detail="Project owner is required")
        data["owner"] = resolved_owner
        data["owner_id"] = resolved_owner_id

    for field, value in data.items():
        if hasattr(deal, field):
            setattr(deal, field, value)

    db.add(deal)
    _commit_or_conflict(db, "Project could not be saved")
    db.refresh(deal)

    next_stage = (deal.stage or "").lower()
    if prev_stage != "won" and next_stage == "won":
        try:
            _run_deal_won_automation(db, deal, current_user)
        except Exception:
            db.rollback()

    return deal


@router.post("/projects", response_model=DealOut)
def create_project(
    project: DealCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    return create_deal(project, db=db, current_user=current_user)


@router.put("/projects/{project_id}", response_model=DealOut)
def update_project(
    project_id: int,
    payload: DealUpdate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    return update_deal(project_id, payload, db=db, current_user=current_user)


@router.delete("/deals/{deal_id}")
def delete_deal(
    deal_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    deal = (
        db.query(Deal)
        .filter(Deal.id == deal_id, Deal.organization_id == _org_id(current_user))
        .first()
    )
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return {"ok": True, "id": deal_id}


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    return delete_deal(project_id, db=db, current_user=current_user)




from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict

from app.db.session import get_db_session
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.user import User, UserRole
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyOut
from app.schemas.contact import ContactCreate, ContactUpdate, ContactOut
from app.schemas.deal import DealCreate, DealUpdate, DealOut
from app.schemas.user import UserOut
from app.api.deps import get_current_user, is_demo_user, require_writable_user
from app.demo import DEMO_SEED_SOURCE


router = APIRouter(prefix="/crm", tags=["crm"])


@router.get("/companies", response_model=List[CompanyOut])
def list_companies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Company)
    if is_demo_user(current_user):
        q = q.filter(Company.lead_source == DEMO_SEED_SOURCE)
    return q.offset(skip).limit(limit).all()


@router.get("/contacts", response_model=List[ContactOut])
def list_contacts(
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Contact)
    if is_demo_user(current_user):
        q = q.join(Company, Company.id == Contact.company_id).filter(Company.lead_source == DEMO_SEED_SOURCE)
    if company_id:
        q = q.filter(Contact.company_id == company_id)
    return q.offset(skip).limit(limit).all()


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
    if is_demo_user(current_user):
        q = q.join(Company, Company.id == Deal.company_id).filter(Company.lead_source == DEMO_SEED_SOURCE)
    if company_id:
        q = q.filter(Deal.company_id == company_id)
    if stage:
        q = q.filter(Deal.stage == stage)
    return q.offset(skip).limit(limit).all()


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
        total_companies = db.query(Company).filter(Company.lead_source == DEMO_SEED_SOURCE).count()
        total_contacts = (
            db.query(Contact)
            .join(Company, Company.id == Contact.company_id)
            .filter(Company.lead_source == DEMO_SEED_SOURCE)
            .count()
        )
        deals: List[Deal] = (
            db.query(Deal)
            .join(Company, Company.id == Deal.company_id)
            .filter(Company.lead_source == DEMO_SEED_SOURCE)
            .all()
        )
    else:
        total_companies = db.query(Company).count()
        total_contacts = db.query(Contact).count()
        deals = db.query(Deal).all()
    total_deals = len(deals)

    open_deals = [d for d in deals if _stage(d) not in ("lost",)]
    won_deals = [d for d in deals if _stage(d) == "won"]

    pipeline_value = sum(_to_float(d.value) for d in open_deals)
    won_value = sum(_to_float(d.value) for d in won_deals)
    conversion_rate = (len(won_deals) / total_deals * 100.0) if total_deals > 0 else 0.0

    return {
        "totalCompanies": total_companies,
        "totalContacts": total_contacts,
        "totalDeals": total_deals,
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
    return db.query(User).order_by(User.id.asc()).all()


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
    if is_demo_user(current_user):
        q = q.join(Company, Company.id == Deal.company_id).filter(Company.lead_source == DEMO_SEED_SOURCE)
    if company_id:
        q = q.filter(Deal.company_id == company_id)
    # По умолчанию не фильтруем по стадии, чтобы можно было привязать событие к любому deal
    return q.offset(skip).limit(limit).all()


@router.post("/companies", response_model=CompanyOut)
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    db_company = Company(**company.dict())
    db.add(db_company)
    db.commit()
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
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    data = payload.dict(exclude_unset=True)
    for field, value in data.items():
        # просто обновляем известные поля; схема уже отфильтровала лишнее
        setattr(company, field, value)

    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.post("/contacts", response_model=ContactOut)
def create_contact(
    contact: ContactCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    # Convert first_name + last_name to single name field
    contact_data = contact.dict()
    if 'first_name' in contact_data and 'last_name' in contact_data:
        contact_data['name'] = f"{contact_data['first_name']} {contact_data['last_name']}"
        del contact_data['first_name']
        del contact_data['last_name']
    
    # Filter out fields that don't exist in the Contact model
    valid_fields = {'company_id', 'name', 'email', 'phone', 'position'}
    contact_data = {k: v for k, v in contact_data.items() if k in valid_fields}
    
    db_contact = Contact(**contact_data)
    db.add(db_contact)
    db.commit()
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
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    data = payload.dict(exclude_unset=True)

    # Сконструировать полное имя из first_name / last_name, если они переданы
    first = data.pop("first_name", None)
    last = data.pop("last_name", None)
    if first is not None or last is not None:
        fname = (first or "").strip()
        lname = (last or "").strip()
        full = f"{fname} {lname}".strip() or fname or lname
        if full:
            contact.name = full

    for field, value in data.items():
        if hasattr(contact, field):
            setattr(contact, field, value)

    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.post("/deals", response_model=DealOut)
def create_deal(
    deal: DealCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    db_deal = Deal(**deal.dict())
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)
    return db_deal




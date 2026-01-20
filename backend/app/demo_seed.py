from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, Iterable, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.api.routes.auth import _hash_password
from app.models.activity import Activity, ActivityType
from app.models.calendar import CalendarEntry
from app.models.company import Company
from app.models.contact import Contact
from app.models.content_task import ContentTask, ContentTaskPriority, ContentTaskStatus
from app.models.content_item import (
    ContentAssetKind,
    ContentAutomationRule,
    ContentItem,
    ContentItemAsset,
    ContentItemChecklistItem,
    ContentItemComment,
    ContentItemReviewer,
    ContentItemStatus,
    ContentItemVersion,
    ContentTemplate,
    Notification,
)
from app.models.deal import Deal
from app.models.performance import Performance
from app.models.upload import Upload
from app.models.user import User, UserRole
from app.models.user_category import UserCategory
from app.models.organization import Organization


from app.demo import DEMO_SEED_SOURCE


def _to_decimal(value: int | float | str | Decimal | None) -> Decimal | None:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return value
    try:
        return Decimal(str(value))
    except Exception:
        return None


def _upsert_one(
    db: Session,
    model: Any,
    *,
    where: Iterable[Any],
    create: Dict[str, Any],
    update: Dict[str, Any],
) -> Tuple[Any, bool]:
    obj = db.query(model).filter(*list(where)).first()
    if obj:
        for k, v in update.items():
            setattr(obj, k, v)
        db.add(obj)
        return obj, False
    obj = model(**create)
    db.add(obj)
    return obj, True


def seed_demo_agency(
    db: Session,
    *,
    email: str,
    password: str,
    reset: bool = False,
    organization_id: int = 1,
) -> Dict[str, Any]:
    """
    Create (or refresh) a single demo account and a realistic dataset.

    Notes:
    - CRM + performance tables are currently global in this app (no owner_id).
      We tag seeded CRM rows with lead_source=DEMO_SEED_SOURCE to keep them identifiable.
    - Per-user data (activities, calendar, user categories, content tasks) is attached to demo user.
    """

    now = datetime.now(timezone.utc)
    year = now.year
    demo_email = (email or "").strip().lower()
    if not demo_email:
        raise ValueError("email is required")
    if not password or len(password) < 6:
        raise ValueError("password must be at least 6 chars")

    org_id = int(organization_id or 1)
    # Ensure organization exists (bootstrap/migration creates id=1 by default).
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        org = Organization(id=org_id, name="Default" if org_id == 1 else f"Org {org_id}")
        db.add(org)
        db.commit()
        db.refresh(org)

    created: Dict[str, int] = {
        "user": 0,
        "companies": 0,
        "contacts": 0,
        "deals": 0,
        "user_categories": 0,
        "activities": 0,
        "calendar_entries": 0,
        "content_items": 0,
        "content_item_assets": 0,
        "content_item_checklist": 0,
        "content_item_versions": 0,
        "content_item_comments": 0,
        "content_item_reviewers": 0,
        "content_templates": 0,
        "content_automation_rules": 0,
        "notifications": 0,
        "content_tasks": 0,
        "performance_rows": 0,
    }
    updated: Dict[str, int] = {k: 0 for k in created.keys()}

    # --- (Optional) reset demo-owned + demo-tagged data ---
    if reset:
        # Per-user domain objects (safe to wipe for demo user)
        existing_demo = db.query(User).filter(User.email == demo_email).first()
        if existing_demo:
            if getattr(existing_demo, "organization_id", None) not in (None, org_id):
                raise ValueError("Demo email already exists in another organization")
            db.query(UserCategory).filter(UserCategory.user_id == existing_demo.id).delete()
            db.query(CalendarEntry).filter(CalendarEntry.owner_id == existing_demo.id).delete()
            db.query(Activity).filter(Activity.owner_id == existing_demo.id).delete()
            db.query(ContentTask).filter(ContentTask.owner_id == existing_demo.id).delete()
            db.query(ContentItem).filter(ContentItem.owner_id == existing_demo.id).delete()
            db.query(Notification).filter(Notification.user_id == existing_demo.id).delete()
            db.query(ContentAutomationRule).filter(ContentAutomationRule.created_by == existing_demo.id).delete()
            db.query(ContentTemplate).filter(ContentTemplate.created_by == existing_demo.id).delete()

        # Demo-tagged CRM rows
        demo_companies = db.query(Company).filter(Company.lead_source == DEMO_SEED_SOURCE, Company.organization_id == org_id).all()
        demo_company_ids = [c.id for c in demo_companies]
        if demo_company_ids:
            db.query(Deal).filter(Deal.company_id.in_(demo_company_ids)).delete(synchronize_session=False)
            db.query(Contact).filter(Contact.company_id.in_(demo_company_ids)).delete(synchronize_session=False)
            db.query(Company).filter(Company.id.in_(demo_company_ids)).delete(synchronize_session=False)

        # Performance rows are optional; remove only demo-tagged metric names
        demo_metrics = {"demo_revenue", "demo_leads", "demo_spend", "demo_roi"}
        db.query(Performance).filter(Performance.metric.in_(list(demo_metrics)), Performance.organization_id == org_id).delete(synchronize_session=False)

        db.commit()

    # --- Demo user ---
    demo_user = db.query(User).filter(User.email == demo_email).first()
    if not demo_user:
        demo_user = User(
            email=demo_email,
            role=UserRole.user,
            hashed_password=_hash_password(password),
            is_verified=True,
            organization_id=org_id,
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        created["user"] += 1
    else:
        if getattr(demo_user, "organization_id", None) not in (None, org_id):
            raise ValueError("Demo email already exists in another organization")
        changed = False
        if reset:
            demo_user.hashed_password = _hash_password(password)
            changed = True
        if not bool(demo_user.is_verified):
            demo_user.is_verified = True
            changed = True
        if demo_user.role != UserRole.user:
            # Keep demo account non-privileged
            demo_user.role = UserRole.user
            changed = True
        if getattr(demo_user, "organization_id", None) != org_id:
            demo_user.organization_id = org_id
            changed = True
        if changed:
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            updated["user"] += 1

    # --- User categories (marketing circle rings) ---
    db.query(UserCategory).filter(UserCategory.user_id == demo_user.id, UserCategory.organization_id == org_id).delete()
    demo_categories = [
        ("VERKAUFSFOERDERUNG", "#ef4444"),
        ("IMAGE", "#f97316"),
        ("EMPLOYER_BRANDING", "#8b5cf6"),
        ("KUNDENPFLEGE", "#10b981"),
    ]
    for idx, (name, color) in enumerate(demo_categories):
        db.add(
            UserCategory(
                user_id=demo_user.id,
                organization_id=org_id,
                name=name,
                color=color,
                position=idx,
            )
        )
    db.commit()
    created["user_categories"] = len(demo_categories)

    # --- CRM: 2–3 clients (companies) ---
    companies_payload = [
        {
            "name": "AlpenBerg Outdoor AG",
            "industry": "Outdoor & Retail",
            "website": "https://alpenberg-outdoor.example",
            "phone": "+41 44 555 12 10",
            "email": "info@alpenberg-outdoor.example",
            "address": "Bahnhofstrasse 12, 8001 Zürich",
            "status": "active",
            "revenue": _to_decimal("4200000.00"),
            "employees": 42,
            "notes": "Fokus: DACH‑E-Commerce, Saisonspitzen (Winter/Sommer), ROAS‑getrieben.",
            "lead_source": DEMO_SEED_SOURCE,
            "priority": "high",
            "tags": "ecommerce,performance,dach",
            "contact_person_name": "Nina Keller",
            "contact_person_position": "Marketing Lead",
            "contact_person_email": "nina.keller@alpenberg-outdoor.example",
            "contact_person_phone": "+41 44 555 12 11",
        },
        {
            "name": "Helvetia FinTech GmbH",
            "industry": "FinTech / SaaS",
            "website": "https://helvetiafintech.example",
            "phone": "+41 43 555 31 20",
            "email": "hello@helvetiafintech.example",
            "address": "Technoparkstrasse 3, 8005 Zürich",
            "status": "active",
            "revenue": _to_decimal("8600000.00"),
            "employees": 68,
            "notes": "B2B Leadgen, ABM auf LinkedIn, starke Compliance‑Anforderungen.",
            "lead_source": DEMO_SEED_SOURCE,
            "priority": "medium",
            "tags": "saas,abm,linkedin",
            "contact_person_name": "Lukas Steiner",
            "contact_person_position": "Head of Growth",
            "contact_person_email": "lukas.steiner@helvetiafintech.example",
            "contact_person_phone": "+41 43 555 31 21",
        },
        {
            "name": "MediCare Zürich Praxisgruppe",
            "industry": "Healthcare",
            "website": "https://medicare-zuerich.example",
            "phone": "+41 44 555 80 00",
            "email": "kontakt@medicare-zuerich.example",
            "address": "Seefeldstrasse 88, 8008 Zürich",
            "status": "active",
            "revenue": _to_decimal("2100000.00"),
            "employees": 25,
            "notes": "Employer Branding + lokale Sichtbarkeit. Fokus auf Bewerbungen & Reputation.",
            "lead_source": DEMO_SEED_SOURCE,
            "priority": "high",
            "tags": "employer_branding,local,healthcare",
            "contact_person_name": "Dr. Anna Meier",
            "contact_person_position": "Geschäftsführung",
            "contact_person_email": "anna.meier@medicare-zuerich.example",
            "contact_person_phone": "+41 44 555 80 01",
        },
    ]

    companies: Dict[str, Company] = {}
    for row in companies_payload:
        payload = dict(row)
        payload["organization_id"] = org_id
        obj, was_created = _upsert_one(
            db,
            Company,
            where=[
                Company.lead_source == DEMO_SEED_SOURCE,
                Company.website == row["website"],
                Company.organization_id == org_id,
            ],
            create=payload,
            update=payload,
        )
        companies[row["name"]] = obj
        if was_created:
            created["companies"] += 1
        else:
            updated["companies"] += 1

    db.commit()

    # --- CRM: contacts (2–3 per company) ---
    contacts_payload = [
        # AlpenBerg
        {
            "company": "AlpenBerg Outdoor AG",
            "name": "Nina Keller",
            "email": "nina.keller@alpenberg-outdoor.example",
            "phone": "+41 44 555 12 11",
            "position": "Marketing Lead",
        },
        {
            "company": "AlpenBerg Outdoor AG",
            "name": "Marco Huber",
            "email": "marco.huber@alpenberg-outdoor.example",
            "phone": "+41 44 555 12 15",
            "position": "E‑Commerce Manager",
        },
        # Helvetia FinTech
        {
            "company": "Helvetia FinTech GmbH",
            "name": "Lukas Steiner",
            "email": "lukas.steiner@helvetiafintech.example",
            "phone": "+41 43 555 31 21",
            "position": "Head of Growth",
        },
        {
            "company": "Helvetia FinTech GmbH",
            "name": "Sofia Braun",
            "email": "sofia.braun@helvetiafintech.example",
            "phone": "+41 43 555 31 22",
            "position": "Marketing Operations",
        },
        # MediCare
        {
            "company": "MediCare Zürich Praxisgruppe",
            "name": "Dr. Anna Meier",
            "email": "anna.meier@medicare-zuerich.example",
            "phone": "+41 44 555 80 01",
            "position": "Geschäftsführung",
        },
        {
            "company": "MediCare Zürich Praxisgruppe",
            "name": "Julia Schmid",
            "email": "julia.schmid@medicare-zuerich.example",
            "phone": "+41 44 555 80 03",
            "position": "HR & Recruiting",
        },
    ]

    contacts: Dict[str, Contact] = {}
    for row in contacts_payload:
        company = companies[row["company"]]
        create = {
            "company_id": company.id,
            "name": row["name"],
            "email": row["email"],
            "phone": row.get("phone"),
            "position": row.get("position"),
            "organization_id": org_id,
        }
        obj, was_created = _upsert_one(
            db,
            Contact,
            where=[Contact.email == row["email"], Contact.company_id == company.id, Contact.organization_id == org_id],
            create=create,
            update=create,
        )
        contacts[row["email"]] = obj
        if was_created:
            created["contacts"] += 1
        else:
            updated["contacts"] += 1
    db.commit()

    # --- CRM: 5–10 projects (deals) ---
    def _dt(month: int, day: int, hour: int = 10) -> datetime:
        return datetime(year, month, day, hour, 0, tzinfo=timezone.utc)

    deals_payload = [
        {
            "company": "AlpenBerg Outdoor AG",
            "contact_email": "marco.huber@alpenberg-outdoor.example",
            "title": "Sommer Sales Campaign (Search + Social)",
            "value": _to_decimal("28000.00"),
            "stage": "proposal",
            "probability": 55,
            "expected_close_date": _dt(3, 10),
            "owner": "KABOOM Demo",
            "notes": "DEMO: Saison‑Kampagne mit ROAS‑Ziel 5.0+.",
        },
        {
            "company": "AlpenBerg Outdoor AG",
            "contact_email": "nina.keller@alpenberg-outdoor.example",
            "title": "E‑Commerce Tracking & CRM Automation",
            "value": _to_decimal("18000.00"),
            "stage": "negotiation",
            "probability": 70,
            "expected_close_date": _dt(2, 5),
            "owner": "KABOOM Demo",
            "notes": "DEMO: GA4, server-side tagging, E-Mail‑Flows.",
        },
        {
            "company": "AlpenBerg Outdoor AG",
            "contact_email": "nina.keller@alpenberg-outdoor.example",
            "title": "Brand Storytelling Video Series",
            "value": _to_decimal("12000.00"),
            "stage": "won",
            "probability": 100,
            "expected_close_date": _dt(1, 18),
            "owner": "KABOOM Demo",
            "notes": "DEMO: 3 Videos + Cutdowns für Paid Social.",
        },
        {
            "company": "Helvetia FinTech GmbH",
            "contact_email": "lukas.steiner@helvetiafintech.example",
            "title": "LinkedIn ABM Pilot (DACH)",
            "value": _to_decimal("35000.00"),
            "stage": "qualified",
            "probability": 40,
            "expected_close_date": _dt(4, 2),
            "owner": "KABOOM Demo",
            "notes": "DEMO: Target Accounts, Sponsored Content, Lead Gen Forms.",
        },
        {
            "company": "Helvetia FinTech GmbH",
            "contact_email": "sofia.braun@helvetiafintech.example",
            "title": "Website Relaunch & CRO Sprint",
            "value": _to_decimal("24000.00"),
            "stage": "lead",
            "probability": 20,
            "expected_close_date": _dt(6, 14),
            "owner": "KABOOM Demo",
            "notes": "DEMO: Design System + Conversion‑Optimierung.",
        },
        {
            "company": "Helvetia FinTech GmbH",
            "contact_email": "sofia.braun@helvetiafintech.example",
            "title": "Thought Leadership Content Engine",
            "value": _to_decimal("15000.00"),
            "stage": "negotiation",
            "probability": 65,
            "expected_close_date": _dt(3, 28),
            "owner": "KABOOM Demo",
            "notes": "DEMO: 4 Artikel/Monat + Distribution.",
        },
        {
            "company": "MediCare Zürich Praxisgruppe",
            "contact_email": "julia.schmid@medicare-zuerich.example",
            "title": "Employer Branding Careers Funnel",
            "value": _to_decimal("22000.00"),
            "stage": "proposal",
            "probability": 50,
            "expected_close_date": _dt(5, 6),
            "owner": "KABOOM Demo",
            "notes": "DEMO: Karriere‑Landingpage + Job Ads + Tracking.",
        },
    ]

    deals: Dict[str, Deal] = {}
    for row in deals_payload:
        company = companies[row["company"]]
        contact = contacts.get(row["contact_email"])
        create = {
            "company_id": company.id,
            "contact_id": contact.id if contact else None,
            "title": row["title"],
            "value": row["value"],
            "stage": row["stage"],
            "probability": row["probability"],
            "expected_close_date": row["expected_close_date"],
            "owner": row["owner"],
            "notes": row["notes"],
            "organization_id": org_id,
        }
        obj, was_created = _upsert_one(
            db,
            Deal,
            where=[
                Deal.company_id == company.id,
                Deal.title == row["title"],
                Deal.owner == row["owner"],
                Deal.organization_id == org_id,
            ],
            create=create,
            update=create,
        )
        deals[row["title"]] = obj
        if was_created:
            created["deals"] += 1
        else:
            updated["deals"] += 1
    db.commit()

    # --- Activities (20–25) for demo user ---
    activity_specs = [
        # VERKAUFSFOERDERUNG
        ("Google Ads — Winter Sale", "VERKAUFSFOERDERUNG", "DONE", 2, "4200.00", -90, -60, "Leads + Umsatz in Saisonspitze"),
        ("LinkedIn Lead Gen — ABM Pilot", "VERKAUFSFOERDERUNG", "ACTIVE", 3, "6800.00", -45, 20, "Target Accounts + Lead Gen Forms"),
        ("Landingpage CRO Sprint", "VERKAUFSFOERDERUNG", "DONE", 1, "1500.00", -75, -65, "A/B Tests, Copy, Speed"),
        ("Retargeting Setup (Meta + Google)", "VERKAUFSFOERDERUNG", "PLANNED", 2, "2200.00", 10, 40, "Warenkorb-Abbrecher & Lookalikes"),
        ("E‑Mail Nurture Automation", "VERKAUFSFOERDERUNG", "PLANNED", 1, "900.00", 25, 55, "3‑stufige Nurture Sequenz"),
        # IMAGE
        ("Brand Storytelling Video Series", "IMAGE", "ACTIVE", 2, "5200.00", -30, 30, "3 Videos + Cutdowns für Paid Social"),
        ("PR Outreach DACH (Press Kit)", "IMAGE", "PLANNED", 1, "1200.00", 15, 35, "Liste Medien + Outreach + Followups"),
        ("Website Relaunch — Design System", "IMAGE", "PLANNED", 3, "8500.00", 40, 120, "UI/UX + Komponenten + Conversion"),
        ("Quarterly Brand Report", "IMAGE", "PLANNED", 1, "800.00", 60, 75, "Markt, Positionierung, Messaging"),
        ("Customer Case Study (MediCare)", "IMAGE", "PLANNED", 1, "1400.00", 20, 45, "Case Study + Landingpage"),
        # EMPLOYER_BRANDING
        ("Careers Page + Job Ads Template", "EMPLOYER_BRANDING", "ACTIVE", 2, "2600.00", -20, 40, "Bewerbungs‑Funnel + Tracking"),
        ("Employer Branding Photo Shoot", "EMPLOYER_BRANDING", "PLANNED", 1, "1800.00", 35, 37, "Fotos für Karriere & Social"),
        ("LinkedIn Employer Branding Content", "EMPLOYER_BRANDING", "PLANNED", 1, "900.00", 30, 90, "8 Posts + Templates"),
        ("Recruiting Campaign KPI Dashboard", "EMPLOYER_BRANDING", "PLANNED", 1, "600.00", 45, 55, "Bewerbungen, CPL, Quellen"),
        ("Kununu Reputation Sprint", "EMPLOYER_BRANDING", "PLANNED", 1, "500.00", 70, 90, "Review‑Management & Guidelines"),
        # KUNDENPFLEGE
        ("Monthly Client Newsletter", "KUNDENPFLEGE", "ACTIVE", 1, "300.00", -150, 180, "Monatlicher Newsletter mit KPIs & Learnings"),
        ("QBR Meetings (Q1)", "KUNDENPFLEGE", "PLANNED", 1, "0.00", 20, 50, "Quarterly Business Review"),
        ("Onboarding Email Sequence", "KUNDENPFLEGE", "DONE", 1, "450.00", -120, -105, "Welcome + First Value"),
        ("NPS Survey + Follow-ups", "KUNDENPFLEGE", "PLANNED", 1, "350.00", 80, 95, "Umfrage + 1:1 Calls"),
        ("Account Health Check — AlpenBerg", "KUNDENPFLEGE", "DONE", 1, "0.00", -35, -35, "Risiken/Chancen + Next Steps"),
        # Extra to reach ~22
        ("SEO Content Sprint (10 Seiten)", "IMAGE", "PLANNED", 2, "3200.00", 10, 70, "SEO Grundlagen + strukturierte Inhalte"),
        ("CRM Pipeline Cleanup & Playbooks", "VERKAUFSFOERDERUNG", "PLANNED", 1, "1100.00", 5, 25, "Stages, Metriken, Templates"),
    ]

    for title, cat, status, weight, budget, start_off, end_off, notes in activity_specs:
        start_d = (now.date() + timedelta(days=int(start_off))) if start_off is not None else None
        end_d = (now.date() + timedelta(days=int(end_off))) if end_off is not None else None
        activity_type = {
            "VERKAUFSFOERDERUNG": ActivityType.sales,
            "IMAGE": ActivityType.branding,
            "EMPLOYER_BRANDING": ActivityType.employer_branding,
            "KUNDENPFLEGE": ActivityType.kundenpflege,
        }.get(cat, ActivityType.sales)

        create = {
            "title": title,
            "type": activity_type,
            "category_name": cat,
            "budget": _to_decimal(budget),
            "expected_output": notes,
            "weight": float(weight) if weight is not None else None,
            "start_date": start_d,
            "end_date": end_d,
            "status": status,
            "owner_id": demo_user.id,
            "organization_id": org_id,
        }
        obj, was_created = _upsert_one(
            db,
            Activity,
            where=[Activity.owner_id == demo_user.id, Activity.title == title, Activity.organization_id == org_id],
            create=create,
            update=create,
        )
        if was_created:
            created["activities"] += 1
        else:
            updated["activities"] += 1
    db.commit()

    # --- Calendar entries for demo user (linked to CRM/deals) ---
    def _event_window(days_from_now: int, start_h: int, duration_min: int) -> Tuple[datetime, datetime]:
        start = (now + timedelta(days=days_from_now)).replace(hour=start_h, minute=0, second=0, microsecond=0)
        end = start + timedelta(minutes=duration_min)
        return start, end

    calendar_specs = [
        {
            "title": "Kickoff: Sommer Sales Campaign (AlpenBerg)",
            "desc": "Kickoff Call: Ziele, Creatives, KPIs, Tracking.",
            "company": "AlpenBerg Outdoor AG",
            "project": "Sommer Sales Campaign (Search + Social)",
            "days": 3,
            "hour": 10,
            "dur": 60,
            "category": "meeting",
            "priority": "high",
            "location": "Google Meet",
            "attendees": ["nina.keller@alpenberg-outdoor.example", "marco.huber@alpenberg-outdoor.example"],
        },
        {
            "title": "Weekly Performance Sync (Demo)",
            "desc": "Wöchentlicher KPI‑Sync: Budget, ROAS, Leads, nächste Tests.",
            "company": None,
            "project": None,
            "days": 1,
            "hour": 9,
            "dur": 30,
            "category": "sync",
            "priority": "medium",
            "location": "Zoom",
            "attendees": [demo_email],
            "recurrence": {"freq": "weekly", "interval": 1, "count": 12},
        },
        {
            "title": "Content Review: Thought Leadership",
            "desc": "Review: Outline + Distribution Plan (LinkedIn, Newsletter, Website).",
            "company": "Helvetia FinTech GmbH",
            "project": "Thought Leadership Content Engine",
            "days": 7,
            "hour": 14,
            "dur": 45,
            "category": "review",
            "priority": "medium",
            "location": "Teams",
            "attendees": ["sofia.braun@helvetiafintech.example", "lukas.steiner@helvetiafintech.example"],
        },
        {
            "title": "Recruiting Funnel Workshop (MediCare)",
            "desc": "Workshop: Persona, Messaging, Funnel, Tracking.",
            "company": "MediCare Zürich Praxisgruppe",
            "project": "Employer Branding Careers Funnel",
            "days": 10,
            "hour": 11,
            "dur": 90,
            "category": "workshop",
            "priority": "high",
            "location": "MediCare Office",
            "attendees": ["julia.schmid@medicare-zuerich.example"],
        },
    ]

    for spec in calendar_specs:
        start_dt, end_dt = _event_window(int(spec["days"]), int(spec["hour"]), int(spec["dur"]))
        company_id = companies.get(spec["company"]).id if spec.get("company") else None
        project_id = deals.get(spec["project"]).id if spec.get("project") else None
        create = {
            "title": spec["title"],
            "description": spec.get("desc"),
            "start_time": start_dt,
            "end_time": end_dt,
            "event_type": spec.get("category"),
            "status": "PLANNED",
            "color": "#ef4444" if spec.get("priority") in {"high", "urgent"} else "#3b82f6",
            "category": spec.get("category"),
            "location": spec.get("location"),
            "attendees": spec.get("attendees"),
            "priority": spec.get("priority"),
            "recurrence": spec.get("recurrence"),
            "recurrence_exceptions": [],
            "company_id": company_id,
            "project_id": project_id,
            "owner_id": demo_user.id,
            "organization_id": org_id,
        }
        obj, was_created = _upsert_one(
            db,
            CalendarEntry,
            where=[CalendarEntry.owner_id == demo_user.id, CalendarEntry.title == spec["title"], CalendarEntry.organization_id == org_id],
            create=create,
            update=create,
        )
        if was_created:
            created["calendar_entries"] += 1
        else:
            updated["calendar_entries"] += 1
    db.commit()

    # --- Content templates + automation rules (Content Items module) ---
    deal_pack_template_payload = {
        "name": "Deal Won — Content Pack",
        "description": "DEMO Template: automatisch erstellter Content‑Pack bei Deal=won.",
        "channel": "Website",
        "format": "Pack",
        "tags": ["automation", "deal_won", "demo"],
        "checklist": ["Brief", "Copy Draft", "Design", "QA", "Freigabe", "Publish"],
        "tasks": [
            {"title": "Kickoff & Brief", "status": "TODO", "priority": "MEDIUM", "offset_days": 0},
            {"title": "Copy Draft", "status": "TODO", "priority": "HIGH", "offset_days": 2},
            {"title": "Design Review", "status": "TODO", "priority": "MEDIUM", "offset_days": 4},
            {"title": "Final QA + Publish", "status": "TODO", "priority": "HIGH", "offset_days": 6},
        ],
        "reviewers": [demo_user.id],
        "created_by": demo_user.id,
        "organization_id": org_id,
    }
    tpl_pack, was_created = _upsert_one(
        db,
        ContentTemplate,
        where=[
            ContentTemplate.created_by == demo_user.id,
            ContentTemplate.name == deal_pack_template_payload["name"],
            ContentTemplate.organization_id == org_id,
        ],
        create=deal_pack_template_payload,
        update=deal_pack_template_payload,
    )
    if was_created:
        created["content_templates"] += 1
    else:
        updated["content_templates"] += 1

    rule_payload = {
        "name": "Deal won → Content Pack (DEMO)",
        "is_active": True,
        "trigger": "deal_won",
        "template_id": tpl_pack.id,
        "config": {"source": "demo_seed"},
        "created_by": demo_user.id,
        "organization_id": org_id,
    }
    rule, was_created = _upsert_one(
        db,
        ContentAutomationRule,
        where=[
            ContentAutomationRule.created_by == demo_user.id,
            ContentAutomationRule.name == rule_payload["name"],
            ContentAutomationRule.organization_id == org_id,
        ],
        create=rule_payload,
        update=rule_payload,
    )
    if was_created:
        created["content_automation_rules"] += 1
    else:
        updated["content_automation_rules"] += 1
    db.commit()

    # A welcome notification for demo user (shows notifications UI)
    n_payload = {
        "user_id": demo_user.id,
        "organization_id": org_id,
        "type": "info",
        "title": "Willkommen im Demo‑Account",
        "body": "Diese Daten sind read‑only. Du kannst Content Items ansehen, Kalender planen und Reports prüfen.",
        "url": "/content",
        "dedupe_key": f"demo:welcome:{demo_user.id}",
    }
    n, was_created = _upsert_one(
        db,
        Notification,
        where=[Notification.dedupe_key == n_payload["dedupe_key"], Notification.organization_id == org_id],
        create=n_payload,
        update=n_payload,
    )
    if was_created:
        created["notifications"] += 1
    else:
        updated["notifications"] += 1
    db.commit()

    # --- Content Items (campaigns/materials) ---
    default_checklist = ["Brief finalisieren", "Copy schreiben", "Design prüfen", "QA (CTA/Links)", "Freigabe"]
    content_items_specs = [
        {
            "title": "LinkedIn Carousel: ABM Pilot Teaser",
            "channel": "LinkedIn",
            "format": "Carousel",
            "status": ContentItemStatus.REVIEW,
            "tags": ["abm", "pilot", "teaser"],
            "company": "Helvetia FinTech GmbH",
            "project": "ABM Pilot Q1",
            "due_days": 7,
            "schedule_days": 10,
            "assets": [
                {"kind": ContentAssetKind.LINK, "name": "Figma — Carousel", "url": "https://www.figma.com/file/demo-carousel", "source": "figma"},
                {"kind": ContentAssetKind.LINK, "name": "Google Doc — Copy", "url": "https://docs.google.com/document/d/demo-carousel-copy", "source": "docs"},
            ],
        },
        {
            "title": "Newsletter: QBR Einladung",
            "channel": "Email",
            "format": "Newsletter",
            "status": ContentItemStatus.DRAFT,
            "tags": ["qbr", "newsletter"],
            "company": "Helvetia FinTech GmbH",
            "project": "Thought Leadership Content Engine",
            "due_days": 21,
            "schedule_days": 24,
            "assets": [
                {"kind": ContentAssetKind.LINK, "name": "Google Doc — Newsletter", "url": "https://docs.google.com/document/d/demo-newsletter", "source": "docs"},
            ],
        },
        {
            "title": "Case Study Draft (MediCare)",
            "channel": "Website",
            "format": "Case Study",
            "status": ContentItemStatus.DRAFT,
            "tags": ["case-study", "medicare"],
            "company": "MediCare Zürich Praxisgruppe",
            "project": "Employer Branding Careers Funnel",
            "due_days": 18,
            "schedule_days": None,
            "assets": [
                {"kind": ContentAssetKind.LINK, "name": "Interview Notes", "url": "https://docs.google.com/document/d/demo-case-study-notes", "source": "docs"},
            ],
        },
        {
            "title": "Landingpage Copy Review",
            "channel": "Website",
            "format": "Landing Page",
            "status": ContentItemStatus.APPROVED,
            "tags": ["landingpage", "copy"],
            "company": "Bergblick Outdoor AG",
            "project": "Sommer Kampagne 2026",
            "due_days": 5,
            "schedule_days": 12,
            "assets": [
                {"kind": ContentAssetKind.LINK, "name": "Figma — Landing", "url": "https://www.figma.com/file/demo-landing", "source": "figma"},
            ],
        },
        {
            "title": "Employer Branding Post: Team Spotlight",
            "channel": "LinkedIn",
            "format": "Post",
            "status": ContentItemStatus.DRAFT,
            "tags": ["employer-branding", "team"],
            "company": "MediCare Zürich Praxisgruppe",
            "project": "Employer Branding Careers Funnel",
            "due_days": 12,
            "schedule_days": 15,
        },
        {
            "title": "PR Outreach List (DACH)",
            "channel": "PR",
            "format": "List",
            "status": ContentItemStatus.DRAFT,
            "tags": ["pr", "dach"],
            "company": "Helvetia FinTech GmbH",
            "project": "ABM Pilot Q1",
            "due_days": 9,
            "schedule_days": None,
        },
    ]

    content_item_ids: Dict[str, int] = {}
    for spec in content_items_specs:
        company_id = companies.get(spec.get("company")).id if spec.get("company") in companies else None
        project_id = deals.get(spec.get("project")).id if spec.get("project") in deals else None
        due_at = (now + timedelta(days=int(spec.get("due_days") or 0))).replace(hour=12, minute=0, second=0, microsecond=0)
        scheduled_at = None
        if spec.get("schedule_days") is not None:
            scheduled_at = (now + timedelta(days=int(spec.get("schedule_days")))).replace(hour=9, minute=0, second=0, microsecond=0)

        create = {
            "title": spec["title"],
            "channel": spec.get("channel") or "Website",
            "format": spec.get("format"),
            "status": spec.get("status") or ContentItemStatus.DRAFT,
            "tags": spec.get("tags") or [],
            "brief": "DEMO Brief: Ziel, Zielgruppe, CTA, Outline.",
            "body": None,
            "tone": "friendly",
            "language": "de",
            "due_at": due_at,
            "scheduled_at": scheduled_at,
            "published_at": None,
            "company_id": company_id,
            "project_id": project_id,
            "activity_id": None,
            "owner_id": demo_user.id,
            "blocked_reason": None,
            "blocked_by": [],
            "organization_id": org_id,
        }
        obj, was_created = _upsert_one(
            db,
            ContentItem,
            where=[ContentItem.owner_id == demo_user.id, ContentItem.title == spec["title"], ContentItem.organization_id == org_id],
            create=create,
            update=create,
        )
        content_item_ids[spec["title"]] = obj.id
        if was_created:
            created["content_items"] += 1
        else:
            updated["content_items"] += 1

        # Editorial calendar sync demo: create/update linked calendar entry
        if scheduled_at is not None:
            ev_create = {
                "title": f"Content: {obj.title}",
                "description": obj.brief,
                "start_time": scheduled_at,
                "end_time": scheduled_at + timedelta(minutes=30),
                "event_type": "content",
                "status": "PLANNED",
                "color": "#a78bfa",
                "category": obj.channel,
                "priority": "medium",
                "attendees": [demo_email],
                "location": "—",
                "recurrence": None,
                "recurrence_exceptions": [],
                "company_id": company_id,
                "project_id": project_id,
                "content_item_id": obj.id,
                "owner_id": demo_user.id,
                "organization_id": org_id,
            }
            ev, was_created = _upsert_one(
                db,
                CalendarEntry,
                where=[CalendarEntry.owner_id == demo_user.id, CalendarEntry.content_item_id == obj.id, CalendarEntry.organization_id == org_id],
                create=ev_create,
                update=ev_create,
            )
            if was_created:
                created["calendar_entries"] += 1
            else:
                updated["calendar_entries"] += 1

        # Checklist defaults
        for idx, t in enumerate(spec.get("checklist") or default_checklist):
            title = str(t or "").strip()
            if not title:
                continue
            row, was_created = _upsert_one(
                db,
                ContentItemChecklistItem,
                where=[ContentItemChecklistItem.item_id == obj.id, ContentItemChecklistItem.title == title],
                create={"item_id": obj.id, "title": title, "is_done": False, "position": idx},
                update={"title": title, "position": idx},
            )
            if was_created:
                created["content_item_checklist"] += 1
            else:
                updated["content_item_checklist"] += 1

        # Reviewer (self)
        row, was_created = _upsert_one(
            db,
            ContentItemReviewer,
            where=[ContentItemReviewer.item_id == obj.id, ContentItemReviewer.reviewer_id == demo_user.id],
            create={"item_id": obj.id, "reviewer_id": demo_user.id, "role": "reviewer"},
            update={"role": "reviewer"},
        )
        if was_created:
            created["content_item_reviewers"] += 1
        else:
            updated["content_item_reviewers"] += 1

        # Assets (links)
        for a in spec.get("assets") or []:
            url = str(a.get("url") or "").strip()
            if not url:
                continue
            create_asset = {
                "item_id": obj.id,
                "kind": a.get("kind") or ContentAssetKind.LINK,
                "name": a.get("name"),
                "url": url,
                "upload_id": None,
                "source": a.get("source"),
                "mime_type": None,
                "size_bytes": None,
                "version": 1,
                "created_by": demo_user.id,
            }
            asset, was_created = _upsert_one(
                db,
                ContentItemAsset,
                where=[ContentItemAsset.item_id == obj.id, ContentItemAsset.url == url],
                create=create_asset,
                update=create_asset,
            )
            if was_created:
                created["content_item_assets"] += 1
            else:
                updated["content_item_assets"] += 1

        # One initial version
        v_payload = {
            "item_id": obj.id,
            "version": 1,
            "title": obj.title,
            "brief": obj.brief,
            "body": obj.body,
            "meta": {"source": "demo_seed"},
            "created_by": demo_user.id,
        }
        v, was_created = _upsert_one(
            db,
            ContentItemVersion,
            where=[ContentItemVersion.item_id == obj.id, ContentItemVersion.version == 1],
            create=v_payload,
            update=v_payload,
        )
        if was_created:
            created["content_item_versions"] += 1
        else:
            updated["content_item_versions"] += 1

        # A single comment
        c_body = "DEMO: Bitte Feedback bis Freitag, damit wir publishen können."
        c_payload = {"item_id": obj.id, "author_id": demo_user.id, "body": c_body}
        c, was_created = _upsert_one(
            db,
            ContentItemComment,
            where=[ContentItemComment.item_id == obj.id, ContentItemComment.body == c_body],
            create=c_payload,
            update=c_payload,
        )
        if was_created:
            created["content_item_comments"] += 1
        else:
            updated["content_item_comments"] += 1

        # Optional: attach one tiny file as Upload asset for the first item
        if spec["title"] == "LinkedIn Carousel: ABM Pilot Teaser":
            try:
                import hashlib

                payload_bytes = b"DEMO asset file: carousel copy notes\n"
                sha = hashlib.sha256(payload_bytes).hexdigest()
                up = db.query(Upload).filter(Upload.sha256 == sha, Upload.organization_id == org_id).first()
                if not up:
                    up = Upload(
                        original_name="demo-carousel-notes.txt",
                        file_type="text/plain",
                        file_size=len(payload_bytes),
                        content=payload_bytes,
                        sha256=sha,
                        stored_in_db=True,
                        organization_id=org_id,
                    )
                    db.add(up)
                    db.commit()
                    db.refresh(up)
                asset_payload = {
                    "item_id": obj.id,
                    "kind": ContentAssetKind.UPLOAD,
                    "name": up.original_name,
                    "url": None,
                    "upload_id": up.id,
                    "source": "upload",
                    "mime_type": up.file_type,
                    "size_bytes": int(up.file_size or 0),
                    "version": 1,
                    "created_by": demo_user.id,
                }
                a2, was_created = _upsert_one(
                    db,
                    ContentItemAsset,
                    where=[ContentItemAsset.item_id == obj.id, ContentItemAsset.upload_id == up.id],
                    create=asset_payload,
                    update=asset_payload,
                )
                if was_created:
                    created["content_item_assets"] += 1
                else:
                    updated["content_item_assets"] += 1
            except Exception:
                db.rollback()

    db.commit()

    # --- Content tasks (optional, but makes Content Hub look "alive") ---
    content_tasks_specs = [
        ("Blogpost: Winter Sale Learnings", "Website", "Blog", ContentTaskStatus.REVIEW, ContentTaskPriority.MEDIUM, 14),
        ("LinkedIn Carousel: ABM Pilot Teaser", "LinkedIn", "Carousel", ContentTaskStatus.IN_PROGRESS, ContentTaskPriority.HIGH, 7),
        ("Newsletter: QBR Einladung", "Email", "Newsletter", ContentTaskStatus.TODO, ContentTaskPriority.LOW, 21),
        ("Case Study Draft (MediCare)", "Website", "Case Study", ContentTaskStatus.TODO, ContentTaskPriority.MEDIUM, 18),
        ("Ad Creatives Refresh (Meta)", "Meta", "Ads", ContentTaskStatus.TODO, ContentTaskPriority.HIGH, 10),
        ("Landingpage Copy Review", "Website", "Landing Page", ContentTaskStatus.APPROVED, ContentTaskPriority.MEDIUM, 5),
        ("Employer Branding Post: Team Spotlight", "LinkedIn", "Post", ContentTaskStatus.TODO, ContentTaskPriority.MEDIUM, 12),
        ("PR Outreach List (DACH)", "PR", "List", ContentTaskStatus.IN_PROGRESS, ContentTaskPriority.MEDIUM, 9),
        ("Weekly Content Ops Check", "Website", "Ops", ContentTaskStatus.TODO, ContentTaskPriority.LOW, 3),
    ]

    for title, channel, fmt, status, prio, dl_days in content_tasks_specs:
        deadline = (now + timedelta(days=int(dl_days))).replace(hour=12, minute=0, second=0, microsecond=0)
        create = {
            "title": title,
            "channel": channel,
            "format": fmt,
            "status": status,
            "priority": prio,
            "notes": "DEMO: realistisch verknüpft mit CRM/Performance.",
            "deadline": deadline,
            "activity_id": None,
            "content_item_id": content_item_ids.get(title),
            "recurrence": {"freq": "weekly", "interval": 1, "count": 8} if title == "Weekly Content Ops Check" else None,
            "owner_id": demo_user.id,
            "organization_id": org_id,
        }
        obj, was_created = _upsert_one(
            db,
            ContentTask,
            where=[ContentTask.owner_id == demo_user.id, ContentTask.title == title, ContentTask.organization_id == org_id],
            create=create,
            update=create,
        )
        if was_created:
            created["content_tasks"] += 1
        else:
            updated["content_tasks"] += 1
    db.commit()

    # --- Optional "performance_metrics" rows (not used by dashboard charts, but keeps admin stats non-empty) ---
    demo_perf_rows = []
    for m in range(1, 13):
        period = f"{year}-{m:02d}"
        demo_perf_rows.append(("demo_revenue", Decimal(18000 + m * 2200), period))
        demo_perf_rows.append(("demo_leads", Decimal(120 + m * 18), period))
        demo_perf_rows.append(("demo_spend", Decimal(5200 + m * 650), period))
        demo_perf_rows.append(("demo_roi", Decimal("2.6") + (Decimal(m) * Decimal("0.03")), period))

    for metric, value, period in demo_perf_rows:
        create = {"metric": metric, "value": value, "period": period, "organization_id": org_id}
        obj, was_created = _upsert_one(
            db,
            Performance,
            where=[Performance.metric == metric, Performance.period == period, Performance.organization_id == org_id],
            create=create,
            update=create,
        )
        if was_created:
            created["performance_rows"] += 1
        else:
            updated["performance_rows"] += 1
    db.commit()

    return {
        "ok": True,
        "demo": {"email": demo_email, "userId": demo_user.id, "readonly": True},
        "created": created,
        "updated": updated,
        "targets": {
            "clients": 3,
            "projects": len(deals_payload),
            "activities": len(activity_specs),
        },
    }


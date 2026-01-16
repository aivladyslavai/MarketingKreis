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
from app.models.deal import Deal
from app.models.performance import Performance
from app.models.user import User, UserRole
from app.models.user_category import UserCategory


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

    created: Dict[str, int] = {
        "user": 0,
        "companies": 0,
        "contacts": 0,
        "deals": 0,
        "user_categories": 0,
        "activities": 0,
        "calendar_entries": 0,
        "content_tasks": 0,
        "performance_rows": 0,
    }
    updated: Dict[str, int] = {k: 0 for k in created.keys()}

    # --- (Optional) reset demo-owned + demo-tagged data ---
    if reset:
        # Per-user domain objects (safe to wipe for demo user)
        existing_demo = db.query(User).filter(User.email == demo_email).first()
        if existing_demo:
            db.query(UserCategory).filter(UserCategory.user_id == existing_demo.id).delete()
            db.query(CalendarEntry).filter(CalendarEntry.owner_id == existing_demo.id).delete()
            db.query(Activity).filter(Activity.owner_id == existing_demo.id).delete()
            db.query(ContentTask).filter(ContentTask.owner_id == existing_demo.id).delete()

        # Demo-tagged CRM rows
        demo_companies = db.query(Company).filter(Company.lead_source == DEMO_SEED_SOURCE).all()
        demo_company_ids = [c.id for c in demo_companies]
        if demo_company_ids:
            db.query(Deal).filter(Deal.company_id.in_(demo_company_ids)).delete(synchronize_session=False)
            db.query(Contact).filter(Contact.company_id.in_(demo_company_ids)).delete(synchronize_session=False)
            db.query(Company).filter(Company.id.in_(demo_company_ids)).delete(synchronize_session=False)

        # Performance rows are optional; remove only demo-tagged metric names
        demo_metrics = {"demo_revenue", "demo_leads", "demo_spend", "demo_roi"}
        db.query(Performance).filter(Performance.metric.in_(list(demo_metrics))).delete(synchronize_session=False)

        db.commit()

    # --- Demo user ---
    demo_user = db.query(User).filter(User.email == demo_email).first()
    if not demo_user:
        demo_user = User(
            email=demo_email,
            role=UserRole.user,
            hashed_password=_hash_password(password),
            is_verified=True,
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        created["user"] += 1
    else:
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
        if changed:
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            updated["user"] += 1

    # --- User categories (marketing circle rings) ---
    db.query(UserCategory).filter(UserCategory.user_id == demo_user.id).delete()
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
        obj, was_created = _upsert_one(
            db,
            Company,
            where=[Company.lead_source == DEMO_SEED_SOURCE, Company.website == row["website"]],
            create=row,
            update=row,
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
        }
        obj, was_created = _upsert_one(
            db,
            Contact,
            where=[Contact.email == row["email"]],
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
        }
        obj, was_created = _upsert_one(
            db,
            Deal,
            where=[Deal.company_id == company.id, Deal.title == row["title"], Deal.owner == row["owner"]],
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
        }
        obj, was_created = _upsert_one(
            db,
            Activity,
            where=[Activity.owner_id == demo_user.id, Activity.title == title],
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
        }
        obj, was_created = _upsert_one(
            db,
            CalendarEntry,
            where=[CalendarEntry.owner_id == demo_user.id, CalendarEntry.title == spec["title"]],
            create=create,
            update=create,
        )
        if was_created:
            created["calendar_entries"] += 1
        else:
            updated["calendar_entries"] += 1
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
            "owner_id": demo_user.id,
        }
        obj, was_created = _upsert_one(
            db,
            ContentTask,
            where=[ContentTask.owner_id == demo_user.id, ContentTask.title == title],
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
        create = {"metric": metric, "value": value, "period": period}
        obj, was_created = _upsert_one(
            db,
            Performance,
            where=[Performance.metric == metric, Performance.period == period],
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


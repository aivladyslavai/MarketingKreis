from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import csv
import io
import hashlib

from app.db.session import get_db_session
from app.models.upload import Upload
from app.models.job import Job
from app.models.activity import Activity, ActivityType
from app.models.company import Company
from app.models.contact import Contact
from app.models.deal import Deal
from app.models.user import User, UserRole
from app.api.deps import get_current_user, get_org_id, is_demo_user, require_writable_user
from app.core.config import get_settings

router = APIRouter(prefix="/uploads", tags=["uploads"]) 


def _map_category_to_activity_type(category: str) -> ActivityType:
    mapping = {
        "VERKAUFSFOERDERUNG": ActivityType.sales,
        "IMAGE": ActivityType.branding,
        "EMPLOYER_BRANDING": ActivityType.employer_branding,
        "KUNDENPFLEGE": ActivityType.kundenpflege,
    }
    return mapping.get((category or "").upper(), ActivityType.sales)


def _parse_csv_to_activities(content: bytes) -> List[Dict[str, Any]]:
    text = content.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(text))
    rows: List[Dict[str, Any]] = []
    for row in reader:
        rows.append(row)
    return rows


def _norm_header(s: str) -> str:
    return (str(s or "").strip().lower().replace(" ", "_").replace("-", "_"))


def _suggest_mapping_crm(headers_in: List[str]) -> Dict[str, Optional[str]]:
    h_norm = [_norm_header(h) for h in headers_in]

    def suggest(*names: str) -> Optional[str]:
        for n in names:
            n2 = _norm_header(n)
            if n2 in h_norm:
                return headers_in[h_norm.index(n2)]
        return None

    return {
        # Company
        "company_name": suggest("company", "company_name", "firma", "unternehmen", "kundename", "name"),
        "company_website": suggest("website", "web", "url", "domain"),
        "company_industry": suggest("industry", "branche"),
        "company_email": suggest("company_email", "email", "e-mail"),
        "company_phone": suggest("phone", "telefon", "tel"),
        "company_notes": suggest("notes", "notiz", "bemerkung", "kommentar"),
        # Contact
        "contact_name": suggest("contact", "contact_name", "ansprechpartner", "kontakt", "kontakt_name"),
        "contact_email": suggest("contact_email", "ansprechpartner_email", "kontakt_email"),
        "contact_phone": suggest("contact_phone", "ansprechpartner_phone", "kontakt_phone"),
        "contact_position": suggest("position", "rolle", "funktion", "title"),
        # Deal
        "deal_title": suggest("deal", "deal_title", "opportunity", "projekt", "project", "angebot"),
        "deal_value": suggest("value", "betrag", "amount", "sum", "umsatz", "revenue", "chf"),
        "deal_stage": suggest("stage", "status", "phase"),
        "deal_probability": suggest("probability", "chance", "wahrscheinlichkeit"),
        "deal_expected_close_date": suggest("expected_close_date", "close_date", "abschluss", "abschlussdatum"),
        "deal_owner": suggest("owner", "deal_owner", "verantwortlich", "owner_email"),
        "deal_notes": suggest("deal_notes", "notes_deal", "bemerkung_deal"),
    }


def _parse_float(v: Any) -> Optional[float]:
    if v in (None, ""):
        return None
    try:
        s = str(v).strip().replace("'", "").replace(" ", "")
        # Accept 1'234.50 or 1.234,50
        if "," in s and "." in s:
            # choose last separator as decimal
            if s.rfind(",") > s.rfind("."):
                s = s.replace(".", "").replace(",", ".")
            else:
                s = s.replace(",", "")
        elif "," in s and "." not in s:
            s = s.replace(".", "").replace(",", ".")
        return float(s)
    except Exception:
        return None


def _parse_int(v: Any) -> Optional[int]:
    if v in (None, ""):
        return None
    try:
        return int(float(str(v).strip().replace("%", "")))
    except Exception:
        return None


def _parse_datetime_loose(v: Any):
    if v in (None, ""):
        return None
    try:
        from datetime import datetime, date

        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime(v.year, v.month, v.day)
        s = str(v).strip()
        for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%m/%d/%Y"):
            try:
                return datetime.strptime(s, fmt)
            except Exception:
                pass
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None
    except Exception:
        return None


@router.get("")
def list_uploads(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    # Uploads are global in current schema; do not show them in demo mode to avoid leaking real data.
    if is_demo_user(current_user):
        return {"items": []}
    org = get_org_id(current_user)
    can_manage_all = current_user.role in {UserRole.admin, UserRole.editor}
    q = db.query(Upload).filter(Upload.organization_id == org)
    if not can_manage_all:
        # Regular users can only see their own uploads (avoid cross-user leakage inside org).
        q = q.filter(Upload.owner_id == current_user.id)
    items = q.order_by(Upload.created_at.desc()).all()
    return {
        "items": [
            {
                "id": str(u.id),
                "original_name": u.original_name,
                "file_type": u.file_type,
                "file_size": int(u.file_size or 0),
                "stored_in_db": bool(getattr(u, "stored_in_db", False)),
                "sha256": getattr(u, "sha256", None),
                "created_at": u.created_at,
            }
            for u in items
        ]
    }


@router.post("")
def upload_file(
    file: UploadFile = File(...),
    mapping: Optional[str] = Form(default=None),
    import_kind: Optional[str] = Form(default="activities"),
    db: Session = Depends(get_db_session),
    current_user: User = Depends(require_writable_user),
):
    """
    Accept a file upload.

    - CSV/XLSX: import rows as Activities (with optional mapping)
    - Other file types: store file in DB (no import)

    Columns supported (case-insensitive):
    title, category|type, status, weight, budget|budgetCHF, notes,
    start|start_date, end|end_date
    """
    settings = get_settings()
    org = get_org_id(current_user)

    # Save upload metadata (and optionally bytes in DB)
    upload = Upload(
        original_name=file.filename or "file",
        file_type=file.content_type or "",
        file_size=0,
        organization_id=org,
        owner_id=current_user.id,
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    # Read all content
    content = file.file.read() or b""
    if len(content) > settings.upload_max_bytes:
        # Avoid silently truncating / losing data.
        raise HTTPException(
            status_code=413,
            detail=f"File too large for current plan (max {settings.upload_max_bytes} bytes).",
        )
    upload.file_size = len(content or b"")
    upload.sha256 = hashlib.sha256(content).hexdigest()
    upload.stored_in_db = bool(settings.upload_store_in_db)
    if settings.upload_store_in_db:
        upload.content = content
    db.add(upload)
    db.commit()
    db.refresh(upload)

    created_count = 0
    skipped_count = 0

    # Parse CSV or Excel
    rows: List[Dict[str, Any]] = []
    ctype = (file.content_type or "").lower()
    name_lower = (file.filename or "").lower()

    try:
        if ctype in {"text/csv", "application/csv", "text/plain"} or name_lower.endswith(".csv"):
            rows = _parse_csv_to_activities(content)
        elif name_lower.endswith(".xlsx") or ctype in {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}:
            try:
                import openpyxl  # type: ignore
            except Exception:
                raise HTTPException(status_code=415, detail="Excel (.xlsx) not supported without openpyxl. Please upload CSV.")

            wb = openpyxl.load_workbook(io.BytesIO(content))
            ws = wb.active
            first = next(ws.iter_rows(min_row=1, max_row=1, values_only=True))
            headers = [str(v or "").strip() for v in first]
            for r in ws.iter_rows(min_row=2, values_only=True):
                row = {headers[i].strip(): (r[i] if i is not None and i < len(r) else None) for i in range(len(headers))}
                rows.append(row)
        else:
            # Non-tabular file: keep as stored upload only (no import)
            return {
                "ok": True,
                "item": {
                    "id": str(upload.id),
                    "original_name": upload.original_name,
                    "file_type": upload.file_type,
                    "file_size": int(upload.file_size or 0),
                    "created_at": upload.created_at,
                },
                "import": {"created": 0, "skipped": 0, "mode": "stored"},
            }

        # Normalize header names
        def g(row: Dict[str, Any], *keys: str):
            for k in keys:
                for variant in (k, k.lower(), k.upper(), k.replace(" ", "_")):
                    if variant in row and row[variant] not in (None, ""):
                        return row[variant]
            return None

        from datetime import datetime, date

        def parse_date(v):
            if v in (None, ""): return None
            if isinstance(v, (datetime, date)): return v if isinstance(v, date) else v.date()
            s = str(v).strip()
            for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%m/%d/%Y"):
                try:
                    return datetime.strptime(s, fmt).date()
                except Exception:
                    pass
            try:
                # ISO
                return datetime.fromisoformat(s.replace('Z', '+00:00')).date()
            except Exception:
                return None

        # Optional mapping from form JSON { field -> headerName }
        mapping_dict: Dict[str, Any] = {}
        if mapping:
            try:
                import json as _json
                mapping_dict = _json.loads(mapping)
            except Exception:
                mapping_dict = {}

        # Optional: category value remap { "DIGITAL_MARKETING": "VERKAUFSFOERDERUNG", ... }
        raw_category_value_map: Dict[str, Any] = {}
        try:
            cvm = (
                mapping_dict.get("category_value_map")
                or mapping_dict.get("__category_value_map")
                or mapping_dict.get("categoryValueMap")
            )
            if isinstance(cvm, dict):
                raw_category_value_map = cvm
        except Exception:
            raw_category_value_map = {}

        def remap_category_value(v: Any) -> str:
            s = str(v or "").strip()
            if not s:
                return s
            key = s.upper()
            # Compare case-insensitively; frontend sends normalized keys by default
            for k, target in raw_category_value_map.items():
                try:
                    if str(k).strip().upper() == key:
                        return str(target)
                except Exception:
                    continue
            return s

        def gm(row: Dict[str, Any], field: str, *fallbacks: str):
            header = (mapping_dict.get(field) or '').strip()
            if header:
                v = row.get(header)
                if v not in (None, ""):
                    return v
            return g(row, *fallbacks)

        kind = (import_kind or "activities").strip().lower()
        if kind not in {"activities", "crm"}:
            kind = "activities"

        if kind == "crm":
            # Restrict CRM import to editor/admin to prevent accidental org-wide writes.
            if current_user.role not in {UserRole.admin, UserRole.editor}:
                raise HTTPException(status_code=403, detail="CRM import requires editor/admin")

            for row in rows:
                try:
                    company_name = str(gm(row, "company_name", "company", "firma", "unternehmen", "name") or "").strip()
                    if not company_name:
                        skipped_count += 1
                        continue

                    company = (
                        db.query(Company)
                        .filter(Company.organization_id == org, Company.name == company_name)
                        .first()
                    )
                    if not company:
                        company = Company(
                            organization_id=org,
                            name=company_name,
                        )
                        db.add(company)
                        db.flush()
                        created_count += 1
                    # Best-effort enrichment (only set when provided)
                    website = gm(row, "company_website", "website", "domain", "url")
                    if website not in (None, ""):
                        company.website = str(website).strip()
                    industry = gm(row, "company_industry", "industry", "branche")
                    if industry not in (None, ""):
                        company.industry = str(industry).strip()
                    c_email = gm(row, "company_email", "email")
                    if c_email not in (None, ""):
                        company.email = str(c_email).strip()
                    c_phone = gm(row, "company_phone", "phone", "telefon", "tel")
                    if c_phone not in (None, ""):
                        company.phone = str(c_phone).strip()
                    c_notes = gm(row, "company_notes", "notes", "notiz", "bemerkung")
                    if c_notes not in (None, ""):
                        company.notes = str(c_notes).strip()[:1024]
                    db.add(company)

                    # Contact (optional)
                    contact_email = gm(row, "contact_email", "kontakt_email", "ansprechpartner_email")
                    contact_name = gm(row, "contact_name", "kontakt", "ansprechpartner", "contact")
                    contact = None
                    if contact_email not in (None, "") or contact_name not in (None, ""):
                        ce = str(contact_email or "").strip().lower()
                        cn = str(contact_name or "").strip()
                        q = db.query(Contact).filter(Contact.organization_id == org, Contact.company_id == company.id)
                        if ce:
                            contact = q.filter(Contact.email == ce).first()
                        if not contact and cn:
                            contact = q.filter(Contact.name == cn).first()
                        if not contact:
                            contact = Contact(organization_id=org, company_id=company.id, name=cn or ce or "Contact")
                            if ce:
                                contact.email = ce
                            db.add(contact)
                            db.flush()
                            created_count += 1
                        # Enrich
                        if cn:
                            contact.name = cn
                        if ce:
                            contact.email = ce
                        phone = gm(row, "contact_phone", "telefon", "phone")
                        if phone not in (None, ""):
                            contact.phone = str(phone).strip()
                        pos = gm(row, "contact_position", "position", "rolle", "funktion")
                        if pos not in (None, ""):
                            contact.position = str(pos).strip()
                        db.add(contact)

                    # Deal (optional)
                    deal_title = gm(row, "deal_title", "deal", "opportunity", "projekt", "project", "angebot")
                    if deal_title not in (None, ""):
                        dt = str(deal_title).strip()
                        if dt:
                            deal = (
                                db.query(Deal)
                                .filter(Deal.organization_id == org, Deal.company_id == company.id, Deal.title == dt)
                                .first()
                            )
                            if not deal:
                                deal = Deal(
                                    organization_id=org,
                                    company_id=company.id,
                                    title=dt,
                                    owner=str(gm(row, "deal_owner", "owner", "verantwortlich") or (current_user.email or "owner")),
                                )
                                db.add(deal)
                                db.flush()
                                created_count += 1
                            value = _parse_float(gm(row, "deal_value", "value", "betrag", "amount", "chf"))
                            if value is not None:
                                deal.value = value
                            stage = gm(row, "deal_stage", "stage", "phase", "status")
                            if stage not in (None, ""):
                                deal.stage = str(stage).strip().lower()[:30]
                            prob = _parse_int(gm(row, "deal_probability", "probability", "chance", "wahrscheinlichkeit"))
                            if prob is not None:
                                deal.probability = max(0, min(100, prob))
                            close_dt = _parse_datetime_loose(gm(row, "deal_expected_close_date", "expected_close_date", "close_date", "abschlussdatum"))
                            if close_dt:
                                deal.expected_close_date = close_dt
                            dnotes = gm(row, "deal_notes", "notes")
                            if dnotes not in (None, ""):
                                deal.notes = str(dnotes).strip()[:1024]
                            # Attach optional contact_id if present
                            if contact is not None:
                                deal.contact_id = contact.id
                            db.add(deal)
                except Exception:
                    skipped_count += 1

            db.commit()
        else:
            for row in rows:
                try:
                    title = gm(row, "title", "title", "name") or "Untitled"
                    category = gm(row, "category", "category", "type") or "VERKAUFSFOERDERUNG"
                    category = remap_category_value(category) or "VERKAUFSFOERDERUNG"
                    status = (gm(row, "status", "status") or "ACTIVE")
                    budget = gm(row, "budget", "budget", "budgetCHF")
                    weight = gm(row, "weight", "weight")
                    notes = gm(row, "notes", "notes", "expected_output")
                    start = parse_date(gm(row, "start", "start", "start_date"))
                    end = parse_date(gm(row, "end", "end", "end_date"))

                    activity = Activity(
                        title=str(title),
                        type=_map_category_to_activity_type(str(category)),
                        category_name=str(category),
                        status=str(status).upper(),
                        budget=float(budget) if budget not in (None, "") else None,
                        weight=float(weight) if weight not in (None, "") else None,
                        expected_output=str(notes) if notes not in (None, "") else None,
                        start_date=start,
                        end_date=end,
                        owner_id=current_user.id,
                        organization_id=org,
                    )
                    db.add(activity)
                    created_count += 1
                except Exception:
                    skipped_count += 1

            db.commit()

        # Record a completed job
        rq_id = f"local-{upload.id}"
        job = Job(
            rq_id=rq_id,
            type=("import_crm" if kind == "crm" else "import_activities"),
            status="finished",
            result=f"created={created_count};skipped={skipped_count}",
            organization_id=org,
        )
        db.add(job)
        db.commit()

        db.refresh(upload)
        return {
            "ok": True,
            "item": {
                "id": str(upload.id),
                "original_name": upload.original_name,
                "file_type": upload.file_type,
                "file_size": int(upload.file_size or 0),
                "created_at": upload.created_at,
            },
            "import": {"created": created_count, "skipped": skipped_count},
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/preview")
def preview_upload(
    file: UploadFile = File(...),
    import_kind: Optional[str] = Form(default="activities"),
    current_user: User = Depends(get_current_user),
):
    """Return headers, first rows and suggested mapping for CSV/XLSX."""
    content = file.file.read()
    ctype = (file.content_type or "").lower()
    name_lower = (file.filename or "").lower()

    rows: List[Dict[str, Any]] = []
    headers: List[str] = []
    suggested: Dict[str, Optional[str]] = {}
    category_values: set[str] = set()
    max_sample_rows = 5
    max_scan_rows = 5000
    max_unique_categories = 200

    def suggest_mapping(headers_in: List[str]) -> Dict[str, Optional[str]]:
        headers_l = [h.lower().replace(" ", "_") for h in headers_in]

        def suggest(*names: str) -> Optional[str]:
            for n in names:
                if n in headers_l:
                    idx = headers_l.index(n)
                    return headers_in[idx]
            return None

        return {
            "title": suggest("title", "name"),
            "category": suggest("category", "type"),
            "status": suggest("status"),
            "budget": suggest("budget", "budgetchf"),
            "notes": suggest("notes", "expected_output"),
            "start": suggest("start", "start_date"),
            "end": suggest("end", "end_date"),
            "weight": suggest("weight"),
        }

    kind = (import_kind or "activities").strip().lower()
    if kind not in {"activities", "crm"}:
        kind = "activities"

    if ctype in {"text/csv", "application/csv", "text/plain"} or name_lower.endswith(".csv"):
        text = content.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(text))
        headers = reader.fieldnames or []
        suggested = _suggest_mapping_crm(headers) if kind == "crm" else suggest_mapping(headers)
        cat_header = (suggested.get("category") if kind == "activities" else None)
        for i, row in enumerate(reader):
            if i < max_sample_rows:
                rows.append(row)
            if cat_header:
                v = row.get(cat_header)
                if v not in (None, ""):
                    s = str(v).strip()
                    if s:
                        category_values.add(s)
            if i >= max_scan_rows or len(category_values) >= max_unique_categories:
                break
    elif name_lower.endswith(".xlsx") or ctype in {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}:
        try:
            import openpyxl  # type: ignore
        except Exception:
            raise HTTPException(status_code=415, detail="Excel (.xlsx) not supported without openpyxl. Please upload CSV.")
        wb = openpyxl.load_workbook(io.BytesIO(content))
        ws = wb.active
        first = next(ws.iter_rows(min_row=1, max_row=1, values_only=True))
        headers = [str(v or "").strip() for v in first]
        suggested = _suggest_mapping_crm(headers) if kind == "crm" else suggest_mapping(headers)
        cat_header = (suggested.get("category") if kind == "activities" else None)
        cat_idx: Optional[int] = None
        if cat_header and cat_header in headers:
            try:
                cat_idx = headers.index(cat_header)
            except Exception:
                cat_idx = None

        for i, r in enumerate(ws.iter_rows(min_row=2, values_only=True)):
            if i < max_sample_rows:
                row = {headers[i2].strip(): (r[i2] if i2 is not None and i2 < len(r) else None) for i2 in range(len(headers))}
                rows.append(row)
            if cat_idx is not None and cat_idx < len(r):
                v = r[cat_idx]
                if v not in (None, ""):
                    s = str(v).strip()
                    if s:
                        category_values.add(s)
            if i >= max_scan_rows or len(category_values) >= max_unique_categories:
                break
    else:
        raise HTTPException(status_code=415, detail="Unsupported file type. Upload CSV or XLSX")

    return {
        "headers": headers,
        "samples": rows,
        "suggested_mapping": suggested,
        **({"category_values": sorted(list(category_values))} if kind == "activities" else {}),
        "import_kind": kind,
    }


@router.get("/template.csv")
def template_csv(
    current_user: User = Depends(get_current_user),
) -> Response:
    headers = ["Title","Category","Status","BudgetCHF","Start","End","Notes","Weight"]
    example1 = ["Sommer Aktion","VERKAUFSFOERDERUNG","ACTIVE","1200","2025-06-01","2025-06-30","Promo Juni","1"]
    example2 = ["Brand Kampagne","IMAGE","PLANNED","5000","01.07.2025","31.07.2025","Awareness","2"]
    lines = [",".join(headers), ",".join(map(str, example1)), ",".join(map(str, example2))]
    content = "\n".join(lines)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=activities-template.csv"},
    )


@router.get("/template.xlsx")
def template_xlsx(
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    try:
        import openpyxl  # type: ignore
    except Exception:
        # Fallback: serve CSV if xlsx unsupported
        return StreamingResponse(
            iter([b"Title,Category,Status,BudgetCHF,Start,End,Notes,Weight\nSommer Aktion,VERKAUFSFOERDERUNG,ACTIVE,1200,2025-06-01,2025-06-30,Promo Juni,1\nBrand Kampagne,IMAGE,PLANNED,5000,01.07.2025,31.07.2025,Awareness,2\n"]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=activities-template.csv"},
        )

    from io import BytesIO

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Template"
    ws.append(["Title","Category","Status","BudgetCHF","Start","End","Notes","Weight"])
    ws.append(["Sommer Aktion","VERKAUFSFOERDERUNG","ACTIVE",1200,"2025-06-01","2025-06-30","Promo Juni",1])
    ws.append(["Brand Kampagne","IMAGE","PLANNED",5000,"01.07.2025","31.07.2025","Awareness",2])

    bio = BytesIO()
    wb.save(bio)
    bio.seek(0)
    return StreamingResponse(
        bio,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=activities-template.xlsx"},
    )



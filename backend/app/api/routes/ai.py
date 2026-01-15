from __future__ import annotations

import json
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.session import get_db_session
from app.models.company import Company
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["ai"])


class ActivitySuggestRequest(BaseModel):
    company_id: Optional[int] = None
    # Free-form draft payload from the UI
    draft: Optional[Dict[str, Any]] = None
    # Optional refinement prompt (title/description)
    prompt: Optional[Dict[str, Any]] = None


def _fallback(company: Optional[Company], draft: Dict[str, Any], prompt: Dict[str, Any]) -> Dict[str, str]:
    """
    Deterministic fallback when OpenAI is not configured.
    Produces German, structured suggestions.
    """
    company_name = (getattr(company, "name", None) or "").strip() or None
    industry = (getattr(company, "industry", None) or "").strip() or None
    when = (draft.get("date") or "").strip()
    start_time = (draft.get("startTime") or "").strip()
    end_time = (draft.get("endTime") or "").strip()
    typ = str(draft.get("type") or "").strip().lower() or "event"
    priority = str(draft.get("priority") or "").strip().lower() or "medium"

    base_title = str(prompt.get("title") or draft.get("title") or "").strip()
    if not base_title or len(base_title) < 3:
        if typ == "meeting":
            base_title = f"{company_name + ' – ' if company_name else ''}Meeting"
        elif typ in {"campaign", "kampagne"}:
            base_title = f"{company_name + ' – ' if company_name else ''}Kampagne"
        elif typ in {"task", "aufgabe"}:
            base_title = f"{company_name + ' – ' if company_name else ''}Aufgabe"
        elif typ == "reminder":
            base_title = f"{company_name + ' – ' if company_name else ''}Erinnerung"
        else:
            base_title = f"{company_name + ' – ' if company_name else ''}Event"

    date_line = when or "—"
    time_line = start_time or "09:00"
    if end_time:
        time_line = f"{time_line}–{end_time}"

    ctx_bits = []
    if company_name:
        ctx_bits.append(company_name)
    if industry:
        ctx_bits.append(industry)
    ctx = " · ".join(ctx_bits) if ctx_bits else None

    description = str(prompt.get("description") or draft.get("description") or "").strip()
    if not description:
        description = (
            f"Datum/Zeit: {date_line} ({time_line})\n"
            + (f"Kontext: {ctx}\n" if ctx else "")
            + "\nZiel:\n- Klaren Output definieren\n- Nächste Schritte festlegen\n"
            + "\nAgenda:\n- Begrüßung & Kontext\n- Update / Status\n- Diskussion & Entscheidungen\n- To‑dos & Verantwortlichkeiten\n"
            + f"\nPriorität: {priority}\n"
        )
    else:
        # Light normalize: ensure we have a minimal structure
        if "Agenda" not in description:
            description = description.strip() + "\n\nAgenda:\n- Update\n- Diskussion\n- To‑dos\n"

    return {"title": base_title, "description": description}


@router.post("/activity_suggest")
async def activity_suggest(
    req: ActivitySuggestRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a title/description suggestion for a calendar entry.

    - If OPENAI_API_KEY is configured, uses OpenAI Chat Completions.
    - Otherwise returns a structured deterministic fallback.
    """
    settings = get_settings()
    draft: Dict[str, Any] = dict(req.draft or {})
    prompt: Dict[str, Any] = dict(req.prompt or {})

    company: Optional[Company] = None
    if req.company_id:
        company = db.query(Company).filter(Company.id == int(req.company_id)).first()

    # Always provide a useful fallback (no hard dependency on OpenAI)
    fallback = _fallback(company, draft, prompt)

    if not settings.openai_api_key:
        return fallback

    company_payload = None
    if company is not None:
        company_payload = {
            "id": company.id,
            "name": getattr(company, "name", None),
            "industry": getattr(company, "industry", None),
            "website": getattr(company, "website", None),
            "email": getattr(company, "email", None),
            "phone": getattr(company, "phone", None),
            "address": getattr(company, "address", None),
        }

    system = (
        "Du bist ein Assistent für eine Marketing‑CRM‑Plattform. "
        "Erzeuge einen prägnanten deutschen Titel und eine klare Beschreibung für einen Kalendereintrag. "
        "Gib ausschließlich JSON zurück: {\"title\": \"...\", \"description\": \"...\"}. "
        "Keine Markdown‑Fences, kein zusätzlicher Text."
    )
    user_msg = {
        "company": company_payload,
        "draft": draft,
        "prompt": prompt,
        "fallback": fallback,
    }

    payload = {
        "model": settings.openai_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user_msg, ensure_ascii=False)},
        ],
        "temperature": 0.6,
        "max_tokens": 350,
    }

    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
            if r.status_code >= 400:
                return fallback
            data = r.json()
            reply = data.get("choices", [{}])[0].get("message", {}).get("content", "") or ""
            try:
                obj = json.loads(reply)
                title = str(obj.get("title") or fallback["title"]).strip() or fallback["title"]
                desc = str(obj.get("description") or fallback["description"]).strip() or fallback["description"]
                return {"title": title, "description": desc}
            except Exception:
                return fallback
    except Exception:
        return fallback


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
from app.models.deal import Deal
from app.models.activity import Activity
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["ai"])


class ActivitySuggestRequest(BaseModel):
    company_id: Optional[int] = None
    # Free-form draft payload from the UI
    draft: Optional[Dict[str, Any]] = None
    # Optional refinement prompt (title/description)
    prompt: Optional[Dict[str, Any]] = None


class ContentAssistantRequest(BaseModel):
    action: str = "brief"  # brief|titles|copy|qa|summary
    company_id: Optional[int] = None
    project_id: Optional[int] = None
    activity_id: Optional[int] = None
    draft: Optional[Dict[str, Any]] = None
    # Optional user instruction, e.g. "more direct", "shorter", etc.
    prompt: Optional[str] = None
    tone: Optional[str] = None
    language: Optional[str] = "de"


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


def _content_fallback(
    *,
    company: Optional[Company],
    project: Optional[Deal],
    activity: Optional[Activity],
    action: str,
    draft: Dict[str, Any],
    prompt: str,
    tone: str,
    language: str,
) -> Dict[str, Any]:
    # Minimal but useful deterministic fallback (German first, as the UI is German).
    lang = (language or "de").strip().lower()
    ch = str(draft.get("channel") or "").strip() or "Website"
    fmt = str(draft.get("format") or "").strip() or "Content"
    title = str(draft.get("title") or "").strip()
    body = str(draft.get("body") or draft.get("text") or draft.get("content") or "").strip()
    brief = str(draft.get("brief") or "").strip()
    audience = str(draft.get("audience") or "").strip()
    cta = str(draft.get("cta") or "").strip()

    company_name = (getattr(company, "name", None) or "").strip() or None
    project_title = (getattr(project, "title", None) or "").strip() or None
    activity_title = (getattr(activity, "title", None) or "").strip() or None

    ctx = " · ".join([v for v in [company_name, project_title, activity_title] if v]) or None

    if action == "titles":
        base = title or f"{fmt} ({ch})"
        titles = [
            f"{base}: 3 Quick Wins",
            f"{base}: So erreichst du {audience or 'deine Zielgruppe'}",
            f"{base}: Checkliste & nächste Schritte",
            f"{base}: Update & Learnings",
            f"{base}: Kurz & klar",
        ]
        if ctx:
            titles[0] = f"{ctx} — {titles[0]}"
        return {"titles": titles[:6]}

    if action == "brief":
        lines = []
        if ctx:
            lines.append(f"Kontext: {ctx}")
        lines.append(f"Channel/Format: {ch} / {fmt}")
        if audience:
            lines.append(f"Zielgruppe: {audience}")
        if tone or prompt:
            lines.append(f"Ton: {(tone or '').strip() or 'neutral'} {('· ' + prompt) if prompt else ''}".strip())
        lines.append("")
        lines.append("Ziel:")
        lines.append("- Was soll nach dem Konsum passieren? (CTA)")
        lines.append("- Welche 1–2 KPIs sind relevant?")
        lines.append("")
        lines.append("Key Messages:")
        lines.append("- Message #1")
        lines.append("- Message #2")
        lines.append("")
        lines.append("Outline:")
        lines.append("1) Hook")
        lines.append("2) Problem")
        lines.append("3) Lösung")
        lines.append("4) Proof")
        lines.append("5) CTA")
        return {"brief": "\n".join(lines), "cta_suggestions": [cta or "Jetzt Kontakt aufnehmen", "Mehr erfahren", "Demo buchen"]}

    if action == "qa":
        issues = []
        if not title:
            issues.append({"severity": "high", "message": "Kein Titel gesetzt."})
        if not body and not brief:
            issues.append({"severity": "high", "message": "Kein Inhalt/Brief vorhanden."})
        if not cta and ("http" not in body.lower()):
            issues.append({"severity": "medium", "message": "CTA oder Link fehlt (was soll der Nutzer als nächstes tun?)."})
        if ch.lower() in {"linkedin", "social", "social media"} and len(body) > 1600:
            issues.append({"severity": "low", "message": "Text ist relativ lang für Social — ggf. kürzen / in Carousel aufteilen."})
        suggestions = [
            "Füge einen klaren CTA hinzu (z.B. 'Demo buchen').",
            "Nutze 2–3 Bulletpoints für bessere Scanbarkeit.",
            "Starte mit einem Hook (Frage/Statistik) statt Intro.",
        ]
        return {"issues": issues, "suggestions": suggestions}

    if action == "summary":
        src = body or brief or title
        short = src.strip().replace("\n", " ")
        summary = short[:240].rstrip() + ("…" if len(short) > 240 else "")
        bullets = [
            f"Channel/Format: {ch} / {fmt}",
            f"Kontext: {ctx}" if ctx else "Kontext: —",
        ]
        return {"summary": summary, "bullets": bullets}

    # copy (default)
    hook = f"{title or fmt}: {audience or 'kurz erklärt'}"
    copy = body or (
        f"{hook}\n\n"
        f"- Punkt 1: Nutzen\n"
        f"- Punkt 2: Proof\n"
        f"- Punkt 3: Next Step\n\n"
        f"CTA: {cta or 'Mehr erfahren'}"
    )
    return {"title": title or hook, "content": copy}


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


@router.post("/content_assistant")
async def content_assistant(
    req: ContentAssistantRequest,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
):
    """
    AI helper for Content Hub.

    Actions:
    - brief: generate a content brief + outline
    - titles: generate title options
    - copy: generate a first draft / copy
    - qa: check for missing CTA, too long, etc.
    - summary: short client-ready summary
    """
    settings = get_settings()
    action = (req.action or "brief").strip().lower()
    draft: Dict[str, Any] = dict(req.draft or {})
    prompt = (req.prompt or "").strip()
    tone = (req.tone or str(draft.get("tone") or "")).strip()
    language = (req.language or str(draft.get("language") or "de")).strip()

    company: Optional[Company] = None
    project: Optional[Deal] = None
    activity: Optional[Activity] = None
    if req.company_id:
        company = db.query(Company).filter(Company.id == int(req.company_id)).first()
    if req.project_id:
        project = db.query(Deal).filter(Deal.id == int(req.project_id)).first()
    if req.activity_id:
        activity = db.query(Activity).filter(Activity.id == int(req.activity_id)).first()

    fallback = _content_fallback(
        company=company,
        project=project,
        activity=activity,
        action=action,
        draft=draft,
        prompt=prompt,
        tone=tone,
        language=language,
    )

    if not settings.openai_api_key:
        return {"ok": True, "action": action, "result": fallback, "provider": "fallback"}

    system = (
        "Du bist ein Content‑Assistent für eine Marketing‑Plattform. "
        "Erzeuge Output passend zum action. "
        "Gib ausschließlich JSON zurück (ohne Markdown)."
    )
    user_msg = {
        "action": action,
        "company": {"id": company.id, "name": company.name, "industry": company.industry} if company else None,
        "project": {"id": project.id, "title": project.title, "stage": project.stage} if project else None,
        "activity": {"id": activity.id, "title": activity.title} if activity else None,
        "draft": draft,
        "prompt": prompt,
        "tone": tone,
        "language": language,
        "fallback": fallback,
        "required_output": {
            "brief": {"brief": "string", "cta_suggestions": ["string"]},
            "titles": {"titles": ["string"]},
            "copy": {"title": "string", "content": "string"},
            "qa": {"issues": [{"severity": "low|medium|high", "message": "string"}], "suggestions": ["string"]},
            "summary": {"summary": "string", "bullets": ["string"]},
        }.get(action, {"result": "any"}),
    }

    payload = {
        "model": settings.openai_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user_msg, ensure_ascii=False)},
        ],
        "temperature": 0.6,
        "max_tokens": 600,
    }

    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=25) as client:
            r = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
            if r.status_code >= 400:
                return {"ok": True, "action": action, "result": fallback, "provider": "fallback"}
            data = r.json()
            reply = data.get("choices", [{}])[0].get("message", {}).get("content", "") or ""
            try:
                obj = json.loads(reply)
                return {"ok": True, "action": action, "result": obj, "provider": "openai"}
            except Exception:
                return {"ok": True, "action": action, "result": fallback, "provider": "fallback"}
    except Exception:
        return {"ok": True, "action": action, "result": fallback, "provider": "fallback"}


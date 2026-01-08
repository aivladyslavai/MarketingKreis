from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.config import get_settings
import httpx

router = APIRouter(prefix="/assistant", tags=["assistant"])


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(req: ChatRequest):
    settings = get_settings()
    api_key = getattr(settings, "openai_api_key", None) or getattr(settings, "OPENAI_API_KEY", None) or None
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    system_prompt = (
        "Du bist der Assistent der KABOOM Marketing Platform. Antworte knapp, klar und mit Zahlen, "
        "wenn möglich. Nutze Markdown für Listen und Hervorhebungen."
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": req.message},
                    ],
                    "temperature": 0.2,
                },
            )
            data = resp.json()
            if resp.status_code >= 400:
                raise HTTPException(status_code=500, detail=data.get("error", {}).get("message", "OpenAI error"))
            content = data["choices"][0]["message"]["content"].strip()
            return {"reply": content}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



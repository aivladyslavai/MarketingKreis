from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.config import get_settings
from app.api.deps import get_current_user
from app.models.user import User
import httpx

router = APIRouter(prefix="/assistant", tags=["assistant"])


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(status_code=400, detail="OPENAI_API_KEY is not configured")

    # Use OpenAI Chat Completions API via HTTPX to avoid heavy SDK
    payload = {
        "model": settings.openai_model,
        "messages": [
            {"role": "system", "content": (
                "You are a helpful assistant for a CRM platform. "
                "Answer concisely, with warm tone, and format short lists with dashes."
            )},
            {"role": "user", "content": req.message},
        ],
        "temperature": 0.6,
        "max_tokens": 400,
    }

    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
        if r.status_code >= 400:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        data = r.json()
        reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {"reply": reply}




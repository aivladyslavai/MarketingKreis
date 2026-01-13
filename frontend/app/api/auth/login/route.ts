import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// Allow longer backend cold starts on Vercel (plan-dependent).
export const maxDuration = 30

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

const BACKEND_TIMEOUT_MS = 25_000

function isAbortError(err: any) {
  return err?.name === "AbortError" || /aborted/i.test(String(err?.message || ""))
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

// Simple proxy for login to the backend.
export async function POST(req: NextRequest) {
  try {
    const apiUrl = getBackendUrl()
    const body = await req.text()
    const backendRes = await fetchWithTimeout(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "include",
      cache: "no-store",
    }, BACKEND_TIMEOUT_MS)

    const text = await backendRes.text()
    const resp = new NextResponse(text, { status: backendRes.status })
    const setCookie = backendRes.headers.get("set-cookie")
    if (setCookie) resp.headers.set("set-cookie", setCookie)

    // Forward backend redirect hint, if any
    const redirectTo = backendRes.headers.get("X-Redirect-To")
    if (redirectTo) resp.headers.set("X-Redirect-To", redirectTo)

    return resp
  } catch (err: any) {
    console.error("Login proxy error (api/auth/login):", err)
    if (isAbortError(err)) {
      return NextResponse.json(
        {
          detail:
            "Zeitüberschreitung: Der Server startet möglicherweise gerade (Render Free Tier). Bitte warte 10–20 Sekunden und versuche es erneut.",
        },
        { status: 504 },
      )
    }
    return NextResponse.json({ detail: err?.message || "Internal error" }, { status: 500 })
  }
}



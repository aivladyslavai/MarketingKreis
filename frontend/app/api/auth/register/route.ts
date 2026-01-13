import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
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

export async function POST(req: NextRequest) {
  try {
    const apiUrl = getBackendUrl()
    const body = await req.text()
    const r = await fetchWithTimeout(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      credentials: 'include',
      cache: 'no-store',
    }, BACKEND_TIMEOUT_MS)
    const setCookie = r.headers.get('set-cookie') || undefined
    const text = await r.text()

    // Try to parse and auto-verify on the server to avoid exposing raw token to the client
    if (r.ok) {
      try {
        const json = JSON.parse(text)
        const token = json?.verify?.token as string | undefined
        if (token) {
          try {
            const vr = await fetch(`${apiUrl}/auth/verify?token=${encodeURIComponent(token)}`, {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
              signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(15000) : undefined,
            })
            if (vr.ok) {
              delete json.verify
              ;(json as any).autoVerified = true
            }
          } catch {}
        }
        const resp = NextResponse.json(json, { status: r.status })
        if (setCookie) resp.headers.set('set-cookie', setCookie)
        return resp
      } catch {
        // fallthrough: backend returned non-JSON
      }
    }

    const resp = new NextResponse(text, { status: r.status })
    if (setCookie) resp.headers.set('set-cookie', setCookie)
    return resp
  } catch (e: any) {
    if (isAbortError(e)) {
      return NextResponse.json(
        {
          error:
            "Zeitüberschreitung: Der Server startet möglicherweise gerade (Render Free Tier). Bitte warte 10–20 Sekunden und versuche es erneut.",
        },
        { status: 504 },
      )
    }
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}






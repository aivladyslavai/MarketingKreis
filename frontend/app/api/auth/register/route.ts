import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

export async function POST(req: NextRequest) {
  try {
    const apiUrl = getBackendUrl()
    // Use explicit AbortController to avoid platform 10s timeouts (set to 9s)
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 9000)
    const r = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await req.text(),
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(t)
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
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}






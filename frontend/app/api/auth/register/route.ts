import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

function appendSetCookies(res: Response, next: NextResponse) {
  const anyHeaders: any = res.headers as any
  const arr: string[] | undefined = anyHeaders?.getSetCookie?.()
  if (Array.isArray(arr) && arr.length) {
    for (const c of arr) next.headers.append("set-cookie", c)
    return
  }
  const sc = res.headers.get("set-cookie")
  if (sc) next.headers.append("set-cookie", sc)
}

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

export async function POST(req: NextRequest) {
  const controller = new AbortController()
  const timeoutMs = 60_000
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const apiUrl = getBackendUrl()
    const bodyText = await req.text()

    const doRegister = () =>
      fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyText,
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      })

    let r = await doRegister()
    // Retry transient gateway errors (Render cold starts)
    if (!r.ok && [502, 503, 504].includes(r.status)) {
      await new Promise((res) => setTimeout(res, 1200))
      r = await doRegister()
    }
    if (!r.ok && [502, 503, 504].includes(r.status)) {
      await new Promise((res) => setTimeout(res, 2200))
      r = await doRegister()
    }

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
        appendSetCookies(r, resp)
        return resp
      } catch {
        // fallthrough: backend returned non-JSON
      }
    }

    const resp = new NextResponse(text, { status: r.status })
    appendSetCookies(r, resp)
    return resp
  } catch (e: any) {
    const isAbort = e?.name === "AbortError"
    const msg = isAbort
      ? "Der Server startet gerade (Cold Start). Bitte 20–30 Sekunden warten und erneut versuchen."
      : e?.message || "Unexpected error"
    const status = isAbort ? 504 : 500
    const resp = NextResponse.json({ detail: msg }, { status })
    if (isAbort) resp.headers.set("retry-after", "10")
    return resp
  } finally {
    clearTimeout(t)
  }
}






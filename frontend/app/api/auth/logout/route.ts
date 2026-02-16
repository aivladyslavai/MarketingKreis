import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function canDeriveCsrfFromCookie(req: NextRequest): boolean {
  const fetchSite = (req.headers.get("sec-fetch-site") || "").toLowerCase()
  if (fetchSite === "cross-site") return false

  const origin = req.headers.get("origin") || ""
  if (origin && origin !== req.nextUrl.origin) return false

  const referer = req.headers.get("referer") || ""
  if (referer && !referer.startsWith(req.nextUrl.origin)) return false

  return true
}

function getCookieFromHeader(cookieHeader: string, name: string): string {
  try {
    const parts = (cookieHeader || "").split(";")
    for (const rawPart of parts) {
      const part = rawPart.trim()
      if (!part) continue
      const eq = part.indexOf("=")
      if (eq < 0) continue
      const k = part.slice(0, eq).trim()
      if (k !== name) continue
      return decodeURIComponent(part.slice(eq + 1))
    }
  } catch {}
  return ""
}

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

// Proxy for logout – clears backend auth cookies through the same origin.
export async function POST(req: NextRequest) {
  try {
    const apiUrl = getBackendUrl()
    const cookie = req.headers.get("cookie") || ""
    const csrfHeader = req.headers.get("x-csrf-token") || ""
    const csrfCookie = cookie && canDeriveCsrfFromCookie(req) ? getCookieFromHeader(cookie, "csrf_token") : ""
    const csrf = csrfHeader || csrfCookie

    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 9000)
    const res = await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      headers: {
        cookie,
        ...(csrf ? { "x-csrf-token": csrf } : {}),
      },
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
    clearTimeout(t)

    const text = await res.text()
    try {
      const json = JSON.parse(text)
      const resp = NextResponse.json(json, { status: res.status })
      appendSetCookies(res, resp)
      return resp
    } catch {
      const resp = new NextResponse(text, { status: res.status })
      appendSetCookies(res, resp)
      return resp
    }
  } catch (err: any) {
    console.error("Logout proxy error (api/auth/logout):", err)
    return NextResponse.json({ detail: err?.message || "Internal error" }, { status: 500 })
  }
}



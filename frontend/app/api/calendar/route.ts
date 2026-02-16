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

async function forward(req: NextRequest) {
  const backendUrl = getBackendUrl()
  const url = `${backendUrl}/calendar${req.nextUrl.search}`
  const cookie = req.headers.get("cookie") || ""
  const csrfHeader = req.headers.get("x-csrf-token") || ""
  const csrfCookie = cookie && canDeriveCsrfFromCookie(req) ? getCookieFromHeader(cookie, "csrf_token") : ""
  const csrf = csrfHeader || csrfCookie
  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      cookie,
      ...(csrf ? { "x-csrf-token": csrf } : {}),
    },
    // For GET, body must be undefined
    body: req.method === "GET" ? undefined : await req.text(),
    cache: "no-store",
    credentials: "include",
  }
  const controller = new AbortController()
  const timeoutMs = req.method === "GET" ? 12_000 : 20_000
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    const text = await res.text()
    const next = new NextResponse(text, { status: res.status })
    appendSetCookies(res, next)
    next.headers.set("Content-Type", res.headers.get("content-type") || "application/json")
    return next
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "Backend request timed out" : e?.message || "Proxy error"
    const status = e?.name === "AbortError" ? 504 : 500
    return NextResponse.json({ error: msg }, { status })
  } finally {
    clearTimeout(t)
  }
}

export async function GET(req: NextRequest) {
  return forward(req)
}
export async function POST(req: NextRequest) {
  return forward(req)
}











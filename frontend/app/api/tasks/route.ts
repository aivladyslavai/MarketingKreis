import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

function canDeriveCsrfFromCookie(req: NextRequest): boolean {
  const fetchSite = (req.headers.get("sec-fetch-site") || "").toLowerCase()
  if (fetchSite === "cross-site") return false
  const origin = req.headers.get("origin") || ""
  if (origin && origin !== req.nextUrl.origin) return false
  const referer = req.headers.get("referer") || ""
  return !(referer && !referer.startsWith(req.nextUrl.origin))
}

function getCookieFromHeader(cookieHeader: string, name: string): string {
  try {
    for (const rawPart of (cookieHeader || "").split(";")) {
      const part = rawPart.trim()
      const eq = part.indexOf("=")
      if (eq < 0) continue
      if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1))
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

async function forward(req: NextRequest) {
  const backendUrl = getBackendUrl()
  const cookie = req.headers.get("cookie") || ""
  const csrfHeader = req.headers.get("x-csrf-token") || ""
  const csrfCookie = cookie && canDeriveCsrfFromCookie(req) ? getCookieFromHeader(cookie, "csrf_token") : ""
  const csrf = csrfHeader || csrfCookie
  const res = await fetch(`${backendUrl}/tasks${req.nextUrl.search}`, {
    method: req.method,
    headers: { "Content-Type": "application/json", cookie, ...(csrf ? { "x-csrf-token": csrf } : {}) },
    body: req.method === "GET" ? undefined : await req.text(),
    cache: "no-store",
    credentials: "include",
  })
  const text = await res.text()
  const next = new NextResponse(text, { status: res.status })
  next.headers.set("Content-Type", res.headers.get("content-type") || "application/json")
  appendSetCookies(res, next)
  return next
}

export async function GET(req: NextRequest) {
  return forward(req)
}

export async function POST(req: NextRequest) {
  return forward(req)
}

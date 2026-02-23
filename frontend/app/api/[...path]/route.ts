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

function getCookie(cookieHeader: string, name: string): string {
  try {
    // Avoid regex pitfalls: parse cookies manually.
    // cookieHeader format: "a=1; b=2; csrf_token=..."
    const parts = (cookieHeader || "").split(";")
    for (const rawPart of parts) {
      const part = rawPart.trim()
      if (!part) continue
      const eq = part.indexOf("=")
      if (eq < 0) continue
      const k = part.slice(0, eq).trim()
      if (k !== name) continue
      const v = part.slice(eq + 1)
      return decodeURIComponent(v)
    }
    return ""
  } catch {
    return ""
  }
}

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

async function forward(req: NextRequest, pathSegments: string[]) {
  try {
    const backendUrl = getBackendUrl()
    const path = pathSegments.map((s) => encodeURIComponent(s)).join("/")
    const url = `${backendUrl}/${path}${req.nextUrl.search}`

    const method = req.method.toUpperCase()
    const cookie = req.headers.get("cookie") || ""
    const contentType = req.headers.get("content-type") || ""
    const csrfHeader = req.headers.get("x-csrf-token") || ""
    // CSRF double-submit: if client forgot to set header, derive from cookie.
    // This makes cookie-auth flows more robust (e.g. 2FA setup/enable).
    const csrfCookie = cookie && canDeriveCsrfFromCookie(req) ? getCookie(cookie, "csrf_token") : ""
    const csrf = csrfHeader || csrfCookie

    const headers: Record<string, string> = {}
    if (cookie) headers.cookie = cookie
    if (contentType) headers["Content-Type"] = contentType
    if (csrf) headers["x-csrf-token"] = csrf
    // Pass-through a few internal headers we use in admin flows.
    // Avoid forwarding all headers to reduce spoofing surface.
    const adminBootstrap = req.headers.get("x-admin-bootstrap") || ""
    if (adminBootstrap) headers["x-admin-bootstrap"] = adminBootstrap

    const body = ["GET", "HEAD"].includes(method) ? undefined : await req.arrayBuffer()

    const controller = new AbortController()
    const timeoutMs = ["GET", "HEAD"].includes(method) ? 12_000 : 20_000
    const t = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
      signal: controller.signal,
    })
    clearTimeout(t)

    const data = await res.arrayBuffer()
    const next = new NextResponse(data, { status: res.status })

    const passthrough = ["content-type", "content-disposition", "cache-control", "location"]
    for (const key of passthrough) {
      const v = res.headers.get(key)
      if (v) next.headers.set(key, v)
    }

    appendSetCookies(res, next)

    // Prevent any accidental CDN/browser caching of authenticated API responses.
    // Even if an upstream forgets cache headers, we force no-store here.
    next.headers.set("cache-control", "no-store")

    // Ensure JSON defaults if backend didn't send content-type
    if (!next.headers.get("content-type")) {
      next.headers.set("content-type", "application/json")
    }

    return next
  } catch (e: any) {
    const msg = e?.name === "AbortError" ? "Backend request timed out" : e?.message || "Proxy error"
    const status = e?.name === "AbortError" ? 504 : 500
    return NextResponse.json({ detail: msg }, { status })
  }
}

type Ctx = { params: { path: string[] } }

export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.path)
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.path)
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.path)
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.path)
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.path)
}
export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.path)
}


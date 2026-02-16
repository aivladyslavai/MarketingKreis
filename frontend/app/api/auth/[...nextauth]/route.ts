import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getCookie(cookieHeader: string, name: string): string {
  try {
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

async function forward(req: NextRequest, authPathSegments: string[]) {
  try {
    const backendUrl = getBackendUrl()
    const path = authPathSegments.map((s) => encodeURIComponent(s)).join("/")
    const url = `${backendUrl}/auth/${path}${req.nextUrl.search}`

    const method = req.method.toUpperCase()
    const cookie = req.headers.get("cookie") || ""
    const contentType = req.headers.get("content-type") || ""
    const csrfHeader = req.headers.get("x-csrf-token") || ""
    const csrfCookie = cookie ? getCookie(cookie, "csrf_token") : ""
    const csrf = csrfHeader || csrfCookie

    const headers: Record<string, string> = {}
    if (cookie) headers.cookie = cookie
    if (contentType) headers["Content-Type"] = contentType
    if (csrf) headers["x-csrf-token"] = csrf

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

    const passthrough = ["content-type", "content-disposition", "cache-control", "location", "x-2fa-required", "x-redirect-to"]
    for (const key of passthrough) {
      const v = res.headers.get(key)
      if (v) next.headers.set(key, v)
    }

    const setCookie = res.headers.get("set-cookie")
    if (setCookie) next.headers.set("set-cookie", setCookie)

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

type Ctx = { params: { nextauth: string[] } }

export async function GET(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.nextauth || [])
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.nextauth || [])
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.nextauth || [])
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.nextauth || [])
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.nextauth || [])
}
export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  return forward(req, ctx.params.nextauth || [])
}


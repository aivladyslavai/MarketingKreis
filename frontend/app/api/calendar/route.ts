import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

async function forward(req: NextRequest) {
  const backendUrl = getBackendUrl()
  const url = `${backendUrl}/calendar${req.nextUrl.search}`
  const init: RequestInit = {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.get("cookie") || "",
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
    const setCookie = res.headers.get("set-cookie")
    if (setCookie) next.headers.set("set-cookie", setCookie)
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











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
  const backendUrl = getBackendUrl()
  const cookie = req.headers.get("cookie") || ""
  const token = req.headers.get("x-admin-bootstrap") || ""
  const csrf = req.headers.get("x-csrf-token") || ""
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 9000)
    const res = await fetch(`${backendUrl}/admin/bootstrap-me`, {
      method: "POST",
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(csrf ? { "x-csrf-token": csrf } : {}),
        "x-admin-bootstrap": token,
      },
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
    clearTimeout(t)
    const text = await res.text()
    const next = new NextResponse(text, { status: res.status })
    const setCookie = res.headers.get("set-cookie")
    if (setCookie) next.headers.set("set-cookie", setCookie)
    next.headers.set("Content-Type", res.headers.get("content-type") || "application/json")
    return next
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to bootstrap" }, { status: 500 })
  }
}



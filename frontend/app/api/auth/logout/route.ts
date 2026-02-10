import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
    const csrf = req.headers.get("x-csrf-token") || ""

    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 9000)
    const res = await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      headers: {
        cookie,
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
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
      const setCookie = res.headers.get("set-cookie")
      if (setCookie) resp.headers.set("set-cookie", setCookie)
      return resp
    } catch {
      return new NextResponse(text, { status: res.status })
    }
  } catch (err: any) {
    console.error("Logout proxy error (api/auth/logout):", err)
    return NextResponse.json({ detail: err?.message || "Internal error" }, { status: 500 })
  }
}



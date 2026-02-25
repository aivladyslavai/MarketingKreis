import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

// Proxy for fetching the current authenticated user profile from the backend.
export async function GET(req: NextRequest) {
  const controller = new AbortController()
  const timeoutMs = 60_000
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const apiUrl = getBackendUrl()
    const cookie = req.headers.get("cookie") || ""

    const res = await fetch(`${apiUrl}/auth/profile`, {
      method: "GET",
      headers: {
        cookie,
      },
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })

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
    const isAbort = err?.name === "AbortError"
    // If backend is cold-starting, don't trap the whole app in an auth error loop.
    // Treat as "not authenticated" and let the UI keep working.
    if (isAbort) {
      const resp = NextResponse.json(null, { status: 200 })
      resp.headers.set("x-mk-degraded", "profile-timeout")
      return resp
    }
    const msg = err?.message || "Proxy error"
    const status = 500
    console.error("Profile proxy error (api/auth/profile):", err)
    return NextResponse.json({ detail: msg }, { status })
  } finally {
    clearTimeout(t)
  }
}



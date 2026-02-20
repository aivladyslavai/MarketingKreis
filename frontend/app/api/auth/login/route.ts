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

// Simple proxy for login to the backend.
export async function POST(req: NextRequest) {
  const controller = new AbortController()
  const timeoutMs = 25_000
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const apiUrl = getBackendUrl()

    const backendRes = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await req.text(),
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })

    const text = await backendRes.text()
    const resp = new NextResponse(text, { status: backendRes.status })
    appendSetCookies(backendRes, resp)

    const redirectTo = backendRes.headers.get("X-Redirect-To")
    if (redirectTo) resp.headers.set("X-Redirect-To", redirectTo)

    return resp
  } catch (err: any) {
    const isAbort = err?.name === "AbortError"
    const msg = isAbort
      ? "Der Server startet gerade (Cold Start). Bitte 20–30 Sekunden warten und erneut versuchen."
      : err?.message || "Proxy error"
    const status = isAbort ? 504 : 500
    console.error("Login proxy error (api/auth/login):", err)
    const resp = NextResponse.json({ detail: msg }, { status })
    if (isAbort) resp.headers.set("retry-after", "10")
    return resp
  } finally {
    clearTimeout(t)
  }
}



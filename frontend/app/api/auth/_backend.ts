import { NextRequest, NextResponse } from "next/server"

export function appendSetCookies(res: Response, next: NextResponse) {
  const anyHeaders: any = res.headers as any
  const arr: string[] | undefined = anyHeaders?.getSetCookie?.()
  if (Array.isArray(arr) && arr.length) {
    for (const c of arr) next.headers.append("set-cookie", c)
    return
  }
  const sc = res.headers.get("set-cookie")
  if (sc) next.headers.append("set-cookie", sc)
}

export function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

export async function proxyAuthRequest(
  req: NextRequest,
  path: string,
  init?: { method?: string; body?: string | null }
) {
  const apiUrl = getBackendUrl()
  const method = init?.method || req.method || "GET"
  const controller = new AbortController()
  const timeoutMs = 60_000
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const cookie = req.headers.get("cookie") || ""
    const csrf = req.headers.get("x-csrf-token") || ""
    const backendRes = await fetch(`${apiUrl}${path}`, {
      method,
      headers: {
        ...(method === "GET" ? {} : { "Content-Type": "application/json" }),
        ...(cookie ? { cookie } : {}),
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      body: method === "GET" ? undefined : (init?.body ?? await req.text()),
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
  } finally {
    clearTimeout(t)
  }
}

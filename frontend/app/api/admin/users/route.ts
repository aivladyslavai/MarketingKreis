import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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

export async function GET(req: NextRequest) {
  const backendUrl = getBackendUrl()
  const cookie = req.headers.get("cookie") || ""
  const qs = req.nextUrl.searchParams.toString()
  const target = `${backendUrl}/admin/users${qs ? `?${qs}` : ""}`

  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 9000)
    const res = await fetch(target, {
      method: "GET",
      headers: cookie ? { cookie } : {},
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
    clearTimeout(t)
    const text = await res.text()
    const next = new NextResponse(text, { status: res.status })
    appendSetCookies(res, next)
    next.headers.set("Content-Type", res.headers.get("content-type") || "application/json")
    return next
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to fetch admin users" },
      { status: 500 },
    )
  }
}


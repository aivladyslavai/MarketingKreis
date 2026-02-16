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

export async function GET(req: NextRequest) {
  const backendUrl = getBackendUrl()
  const url = `${backendUrl}/crm/projects${req.nextUrl.search}`
  const cookie = req.headers.get("cookie") || ""

  const res = await fetch(url, {
    method: "GET",
    headers: { cookie },
    cache: "no-store",
  })

  const text = await res.text()
  const next = new NextResponse(text, { status: res.status })
  appendSetCookies(res, next)
  next.headers.set("Content-Type", res.headers.get("content-type") || "application/json")
  return next
}


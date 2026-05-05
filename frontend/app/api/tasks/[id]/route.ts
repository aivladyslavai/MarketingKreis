import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

function csrf(req: NextRequest, cookie: string): string {
  const header = req.headers.get("x-csrf-token") || ""
  if (header) return header
  const origin = req.headers.get("origin") || ""
  const referer = req.headers.get("referer") || ""
  if ((origin && origin !== req.nextUrl.origin) || (referer && !referer.startsWith(req.nextUrl.origin))) return ""
  for (const raw of cookie.split(";")) {
    const part = raw.trim()
    if (part.startsWith("csrf_token=")) return decodeURIComponent(part.slice("csrf_token=".length))
  }
  return ""
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

async function forward(req: NextRequest, { params }: { params: { id: string } }) {
  const cookie = req.headers.get("cookie") || ""
  const token = csrf(req, cookie)
  const res = await fetch(`${getBackendUrl()}/tasks/${encodeURIComponent(params.id)}`, {
    method: req.method,
    headers: { "Content-Type": "application/json", cookie, ...(token ? { "x-csrf-token": token } : {}) },
    body: req.method === "DELETE" ? undefined : await req.text(),
    cache: "no-store",
    credentials: "include",
  })
  const text = await res.text()
  const next = new NextResponse(text, { status: res.status })
  next.headers.set("Content-Type", res.headers.get("content-type") || "application/json")
  appendSetCookies(res, next)
  return next
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  return forward(req, ctx)
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  return forward(req, ctx)
}

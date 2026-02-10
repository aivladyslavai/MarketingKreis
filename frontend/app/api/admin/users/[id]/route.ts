import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const backendUrl = getBackendUrl()
  const cookie = req.headers.get("cookie") || ""
  const csrf = req.headers.get("x-csrf-token") || ""
  const body = await req.text()
  const target = `${backendUrl}/admin/users/${encodeURIComponent(ctx.params.id)}`

  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 9000)
    const res = await fetch(target, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
        ...(csrf ? { "x-csrf-token": csrf } : {}),
      },
      body,
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
    return NextResponse.json(
      { error: e?.message || "Failed to update admin user" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: { id: string } },
) {
  const backendUrl = getBackendUrl()
  const cookie = req.headers.get("cookie") || ""
  const csrf = req.headers.get("x-csrf-token") || ""
  const target = `${backendUrl}/admin/users/${encodeURIComponent(ctx.params.id)}`

  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 9000)
    const res = await fetch(target, {
      method: "DELETE",
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(csrf ? { "x-csrf-token": csrf } : {}),
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
    return NextResponse.json(
      { error: e?.message || "Failed to delete admin user" },
      { status: 500 },
    )
  }
}


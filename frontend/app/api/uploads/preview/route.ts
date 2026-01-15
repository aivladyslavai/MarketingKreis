import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl()
    const url = `${backendUrl}/uploads/preview`
    const form = await request.formData()
    const cookie = request.headers.get("cookie") || ""

    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 20_000)
    const res = await fetch(url, {
      method: "POST",
      body: form,
      headers: cookie ? { cookie } : {},
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
    console.error("Upload preview proxy error:", e)
    const msg = e?.name === "AbortError" ? "Backend request timed out" : e?.message || "preview failed"
    const status = e?.name === "AbortError" ? 504 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

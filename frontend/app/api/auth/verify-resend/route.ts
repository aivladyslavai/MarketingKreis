import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

export async function POST(req: NextRequest) {
  try {
    const apiUrl = getBackendUrl()
    const body = await req.text()
    const r = await fetch(`${apiUrl}/auth/verify/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "include",
      cache: "no-store",
    })
    const text = await r.text()
    return new NextResponse(text, { status: r.status })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Proxy error" }, { status: 500 })
  }
}


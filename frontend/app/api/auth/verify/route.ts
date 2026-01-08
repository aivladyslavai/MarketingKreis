import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  try {
    const apiUrl = getBackendUrl()
    const r = await fetch(`${apiUrl}/auth/verify?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(15000) : undefined,
    })
    const text = await r.text()
    return new NextResponse(text, { status: r.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}






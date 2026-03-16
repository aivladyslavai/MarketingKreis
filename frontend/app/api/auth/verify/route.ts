import { NextRequest, NextResponse } from "next/server"
import { proxyAuthRequest } from "../_backend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  try {
    return await proxyAuthRequest(req, `/auth/verify?token=${encodeURIComponent(token)}`, { method: "GET" })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}






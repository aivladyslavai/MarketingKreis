import { NextRequest, NextResponse } from "next/server"
import { proxyAuthRequest } from "../../_backend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    return await proxyAuthRequest(req, "/auth/team/members", { method: "GET" })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Unexpected error" }, { status: 500 })
  }
}

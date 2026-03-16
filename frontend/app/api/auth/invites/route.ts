import { NextRequest, NextResponse } from "next/server"
import { proxyAuthRequest } from "../_backend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    return await proxyAuthRequest(req, "/auth/invites", { method: "GET" })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Unexpected error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    return await proxyAuthRequest(req, "/auth/invites", { method: "POST" })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Unexpected error" }, { status: 500 })
  }
}

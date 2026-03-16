import { NextRequest, NextResponse } from "next/server"
import { proxyAuthRequest } from "../../../_backend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  const { inviteId } = params
  try {
    return await proxyAuthRequest(req, `/auth/invites/${encodeURIComponent(inviteId)}/resend`, { method: "POST" })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Unexpected error" }, { status: 500 })
  }
}

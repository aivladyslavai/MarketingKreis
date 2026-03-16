import { NextRequest, NextResponse } from "next/server"
import { proxyAuthRequest } from "../../_backend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  const { inviteId } = params
  try {
    return await proxyAuthRequest(req, `/auth/invites/${encodeURIComponent(inviteId)}`, { method: "DELETE" })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Unexpected error" }, { status: 500 })
  }
}

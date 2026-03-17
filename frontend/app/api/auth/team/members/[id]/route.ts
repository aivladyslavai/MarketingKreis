import { NextRequest, NextResponse } from "next/server"
import { proxyAuthRequest } from "../../../_backend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Ctx = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    return await proxyAuthRequest(req, `/auth/team/members/${encodeURIComponent(params.id)}`, { method: "PATCH" })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Unexpected error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    return await proxyAuthRequest(req, `/auth/team/members/${encodeURIComponent(params.id)}`, { method: "DELETE" })
  } catch (e: any) {
    return NextResponse.json({ detail: e?.message || "Unexpected error" }, { status: 500 })
  }
}

import { NextRequest } from "next/server"
import { proxyAuthRequest } from "../_backend"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  return await proxyAuthRequest(req, "/auth/refresh", { method: "POST" })
}

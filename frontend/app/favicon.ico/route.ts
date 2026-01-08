import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Minimal handler to avoid noisy 404s for /favicon.ico in production.
export async function GET() {
  return new NextResponse(null, { status: 204 })
}


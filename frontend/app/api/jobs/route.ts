import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  // Fallback for build-time or local environments where BACKEND_URL is not set.
  // In real production deployments, BACKEND_URL should be configured correctly.
  return "http://127.0.0.1:8000"
}

export async function GET(request: NextRequest) {
  const backendUrl = getBackendUrl()
  const url = `${backendUrl}/jobs`
  const res = await fetch(url, { headers: request.headers, credentials: "include" })
  const text = await res.text()
  const next = new NextResponse(text, { status: res.status })
  const setCookie = res.headers.get("set-cookie")
  if (setCookie) next.headers.set("set-cookie", setCookie)
  next.headers.set("Content-Type", res.headers.get("content-type") || "application/json")
  return next
}







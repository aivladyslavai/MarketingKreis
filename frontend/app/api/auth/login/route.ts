import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

// Simple proxy for login to the backend.
export async function POST(req: NextRequest) {
  try {
    const apiUrl = getBackendUrl()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 9000)

    const backendRes = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await req.text(),
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const text = await backendRes.text()
    const resp = new NextResponse(text, { status: backendRes.status })
    const setCookie = backendRes.headers.get("set-cookie")
    if (setCookie) resp.headers.set("set-cookie", setCookie)

    // Forward backend redirect hint, if any
    const redirectTo = backendRes.headers.get("X-Redirect-To")
    if (redirectTo) resp.headers.set("X-Redirect-To", redirectTo)

    return resp
  } catch (err: any) {
    console.error("Login proxy error (api/auth/login):", err)
    return NextResponse.json({ detail: err?.message || "Internal error" }, { status: 500 })
  }
}



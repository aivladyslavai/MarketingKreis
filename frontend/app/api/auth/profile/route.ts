import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

// Proxy for fetching the current authenticated user profile from the backend.
export async function GET(req: NextRequest) {
  try {
    const apiUrl = getBackendUrl()
    const cookie = req.headers.get("cookie") || ""

    const res = await fetch(`${apiUrl}/auth/profile`, {
      method: "GET",
      headers: {
        cookie,
      },
      credentials: "include",
      cache: "no-store",
    })

    const text = await res.text()
    try {
      const json = JSON.parse(text)
      const resp = NextResponse.json(json, { status: res.status })
      const setCookie = res.headers.get("set-cookie")
      if (setCookie) resp.headers.set("set-cookie", setCookie)
      return resp
    } catch {
      return new NextResponse(text, { status: res.status })
    }
  } catch (err: any) {
    console.error("Profile proxy error (api/auth/profile):", err)
    return NextResponse.json({ detail: err?.message || "Internal error" }, { status: 500 })
  }
}



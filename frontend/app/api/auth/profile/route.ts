import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Proxy for fetching the current authenticated user profile from the backend.
export async function GET(req: NextRequest) {
  try {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://kreismarketing-backend.onrender.com").replace(/\/$/, "")
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
    return NextResponse.json({ detail: "Internal error" }, { status: 500 })
  }
}



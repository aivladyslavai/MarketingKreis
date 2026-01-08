import { NextRequest, NextResponse } from "next/server"

// Simple proxy for login to the Render backend.
// This avoids any 127.0.0.1 calls in the Vercel environment.
export async function POST(req: NextRequest) {
  try {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://kreismarketing-backend.onrender.com").replace(/\/$/, "")
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
    return NextResponse.json({ detail: "Internal error" }, { status: 500 })
  }
}



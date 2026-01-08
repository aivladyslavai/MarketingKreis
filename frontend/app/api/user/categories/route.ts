import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

function getApiBase() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:3001"
  ).replace(/\/$/, "")
}

export async function GET(req: NextRequest) {
  const apiBase = getApiBase()
  const cookie = req.headers.get("cookie") || ""
  try {
    const res = await fetch(`${apiBase}/user/categories`, {
      method: "GET",
      headers: cookie ? { cookie } : {},
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
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load user categories" },
      { status: 500 },
    )
  }
}

export async function PUT(req: NextRequest) {
  const apiBase = getApiBase()
  const cookie = req.headers.get("cookie") || ""
  try {
    const body = await req.text()
    const res = await fetch(`${apiBase}/user/categories`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body,
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
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to save user categories" },
      { status: 500 },
    )
}
}


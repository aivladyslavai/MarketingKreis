import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

function getApiBase() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:3001"
  ).replace(/\/$/, "")
}

export async function PATCH(
  req: Request,
  ctx: { params: { id: string } },
) {
  const apiBase = getApiBase()
  const cookie = req.headers.get("cookie") || ""
  const body = await req.text()
  const target = `${apiBase}/admin/users/${encodeURIComponent(ctx.params.id)}`

  try {
    const res = await fetch(target, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      body,
      credentials: "include",
      cache: "no-store",
    })
    const text = await res.text()
    try {
      const json = JSON.parse(text)
      return NextResponse.json(json, { status: res.status })
    } catch {
      return new NextResponse(text, { status: res.status })
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to update admin user" },
      { status: 500 },
    )
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: { id: string } },
) {
  const apiBase = getApiBase()
  const cookie = req.headers.get("cookie") || ""
  const target = `${apiBase}/admin/users/${encodeURIComponent(ctx.params.id)}`

  try {
    const res = await fetch(target, {
      method: "DELETE",
      headers: {
        cookie,
      },
      credentials: "include",
      cache: "no-store",
    })
    const text = await res.text()
    try {
      const json = JSON.parse(text)
      return NextResponse.json(json, { status: res.status })
    } catch {
      return new NextResponse(text, { status: res.status })
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to delete admin user" },
      { status: 500 },
    )
  }
}


import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000"
  throw new Error("BACKEND_URL is not configured")
}

async function forward(req: NextRequest) {
  const backendUrl = getBackendUrl()
  const url = `${backendUrl}/crm/contacts${req.nextUrl.search}`
  const cookie = req.headers.get("cookie") || ""

  const res = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      cookie,
    },
    body: req.method === "GET" ? undefined : await req.text(),
    cache: "no-store",
  })

  const text = await res.text()
  const next = new NextResponse(text, { status: res.status })
  const setCookie = res.headers.get("set-cookie")
  if (setCookie) next.headers.set("set-cookie", setCookie)
  next.headers.set("Content-Type", res.headers.get("content-type") || "application/json")
  return next
}

export async function GET(req: NextRequest) {
  return forward(req)
}

export async function POST(req: NextRequest) {
  return forward(req)
}


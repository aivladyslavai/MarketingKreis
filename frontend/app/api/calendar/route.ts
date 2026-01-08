import { NextRequest, NextResponse } from 'next/server'

const BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')

async function forward(req: NextRequest) {
  const url = `${BASE}/calendar`
  const init: RequestInit = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') || '',
    },
    // For GET, body must be undefined
    body: req.method === 'GET' ? undefined : await req.text(),
    cache: 'no-store',
    credentials: 'include',
  }
  const res = await fetch(url, init)
  const text = await res.text()
  const headers: Record<string, string> = { 'Content-Type': res.headers.get('content-type') || 'application/json' }
  return new NextResponse(text, { status: res.status, headers })
}

export async function GET(req: NextRequest) { return forward(req) }
export async function POST(req: NextRequest) { return forward(req) }











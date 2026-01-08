import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const r = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    const setCookie = r.headers.get('set-cookie') || undefined
    const text = await r.text()
    if (!r.ok) {
      return new NextResponse(text || 'Auth failed', { status: r.status })
    }
    const resp = new NextResponse(text, { status: 200 })
    if (setCookie) {
      resp.headers.set('set-cookie', setCookie)
    }
    return resp
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}



import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')
  const cookie = req.headers.get('cookie') || ''
  const body = await req.text()

  try {
    const res = await fetch(`${apiBase}/budget/scenario`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body,
      credentials: 'include',
      cache: 'no-store',
    })
    const text = await res.text()
    try {
      const json = JSON.parse(text)
      return NextResponse.json(json, { status: res.status })
    } catch {
      return new NextResponse(text, { status: res.status })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to model scenario' }, { status: 500 })
  }
}



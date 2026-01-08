import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')
  const cookie = req.headers.get('cookie') || ''
  const token = req.headers.get('x-admin-bootstrap') || ''
  try {
    const res = await fetch(`${apiBase}/admin/bootstrap-me`, {
      method: 'POST',
      headers: {
        cookie,
        'x-admin-bootstrap': token,
      },
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
    return NextResponse.json({ error: e?.message || 'Failed to bootstrap' }, { status: 500 })
  }
}



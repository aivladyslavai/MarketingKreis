import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (process.env.NODE_ENV !== 'production') {
    return 'http://127.0.0.1:8000'
  }
  throw new Error('BACKEND_URL must be set in production for /api/activities proxy')
}

export async function GET(req: NextRequest) {
  try {
    const backendUrl = getBackendUrl()
    const cookie = req.headers.get('cookie') || ''
    const resp = await fetch(`${backendUrl}/activities`, {
      headers: { 'Content-Type': 'application/json', cookie },
    })
    const text = await resp.text()
    const next = new NextResponse(text, { status: resp.status })
    next.headers.set('Content-Type', resp.headers.get('content-type') || 'application/json')
    const setCookie = resp.headers.get('set-cookie')
    if (setCookie) next.headers.set('set-cookie', setCookie)
    return next
  } catch (e) {
    console.error('Activities proxy GET error:', e)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const backendUrl = getBackendUrl()
    const cookie = req.headers.get('cookie') || ''
    const body = await req.text()
    const resp = await fetch(`${backendUrl}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body,
    })
    const text = await resp.text()
    const next = new NextResponse(text, { status: resp.status })
    next.headers.set('Content-Type', resp.headers.get('content-type') || 'application/json')
    const setCookie = resp.headers.get('set-cookie')
    if (setCookie) next.headers.set('set-cookie', setCookie)
    return next
  } catch (e) {
    console.error('Activities proxy POST error:', e)
    return NextResponse.json({ detail: 'Proxy error' }, { status: 500 })
  }
}


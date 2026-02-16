import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function canDeriveCsrfFromCookie(req: NextRequest): boolean {
  const fetchSite = (req.headers.get('sec-fetch-site') || '').toLowerCase()
  if (fetchSite === 'cross-site') return false

  const origin = req.headers.get('origin') || ''
  if (origin && origin !== req.nextUrl.origin) return false

  const referer = req.headers.get('referer') || ''
  if (referer && !referer.startsWith(req.nextUrl.origin)) return false

  return true
}

function getCookieFromHeader(cookieHeader: string, name: string): string {
  try {
    const parts = (cookieHeader || '').split(';')
    for (const rawPart of parts) {
      const part = rawPart.trim()
      if (!part) continue
      const eq = part.indexOf('=')
      if (eq < 0) continue
      const k = part.slice(0, eq).trim()
      if (k !== name) continue
      return decodeURIComponent(part.slice(eq + 1))
    }
  } catch {}
  return ''
}

function appendSetCookies(res: Response, next: NextResponse) {
  const anyHeaders: any = res.headers as any
  const arr: string[] | undefined = anyHeaders?.getSetCookie?.()
  if (Array.isArray(arr) && arr.length) {
    for (const c of arr) next.headers.append('set-cookie', c)
    return
  }
  const sc = res.headers.get('set-cookie')
  if (sc) next.headers.append('set-cookie', sc)
}

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (process.env.NODE_ENV !== 'production') return 'http://127.0.0.1:8000'
  throw new Error('BACKEND_URL must be set in production for /api/activities/[id] proxy')
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const backendUrl = getBackendUrl()
    const cookie = req.headers.get('cookie') || ''
    const csrfHeader = req.headers.get('x-csrf-token') || ''
    const csrfCookie = cookie && canDeriveCsrfFromCookie(req) ? getCookieFromHeader(cookie, 'csrf_token') : ''
    const csrf = csrfHeader || csrfCookie
    const body = await req.text()
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 12_000)
    const resp = await fetch(`${backendUrl}/activities/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', cookie, ...(csrf ? { 'x-csrf-token': csrf } : {}) },
      body,
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(t)
    const text = await resp.text()
    const next = new NextResponse(text, { status: resp.status })
    next.headers.set('Content-Type', resp.headers.get('content-type') || 'application/json')
    appendSetCookies(resp, next)
    return next
  } catch (e) {
    console.error('Activities proxy PUT error:', e)
    return NextResponse.json({ detail: 'Proxy error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const backendUrl = getBackendUrl()
    const cookie = req.headers.get('cookie') || ''
    const csrfHeader = req.headers.get('x-csrf-token') || ''
    const csrfCookie = cookie && canDeriveCsrfFromCookie(req) ? getCookieFromHeader(cookie, 'csrf_token') : ''
    const csrf = csrfHeader || csrfCookie
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 12_000)
    const resp = await fetch(`${backendUrl}/activities/${params.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', cookie, ...(csrf ? { 'x-csrf-token': csrf } : {}) },
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(t)
    const text = await resp.text()
    const next = new NextResponse(text, { status: resp.status })
    next.headers.set('Content-Type', resp.headers.get('content-type') || 'application/json')
    appendSetCookies(resp, next)
    return next
  } catch (e) {
    console.error('Activities proxy DELETE error:', e)
    return NextResponse.json({ detail: 'Proxy error' }, { status: 500 })
  }
}



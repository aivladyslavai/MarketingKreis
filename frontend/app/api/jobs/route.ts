import { NextRequest, NextResponse } from 'next/server'

function getBackendUrl() {
  const fromEnv = process.env.BACKEND_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (process.env.NODE_ENV !== 'production') {
    return 'http://127.0.0.1:8000'
  }
  throw new Error('BACKEND_URL must be set in production for /api/jobs proxy')
}

export async function GET(request: NextRequest) {
  const backendUrl = getBackendUrl()
  const url = `${backendUrl}/jobs`
  const res = await fetch(url, { headers: request.headers, credentials: 'include' })
  const text = await res.text()
  const next = new NextResponse(text, { status: res.status })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) next.headers.set('set-cookie', setCookie)
  next.headers.set('Content-Type', res.headers.get('content-type') || 'application/json')
  return next
}







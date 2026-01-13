import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function POST(request: NextRequest) {
  const url = `${backendUrl}/uploads/preview`
  try {
    const form = await request.formData()
    const res = await fetch(url, {
      method: 'POST',
      body: form,
      headers: { cookie: request.headers.get('cookie') || '' },
      credentials: 'include',
    })
    const text = await res.text()
    const next = new NextResponse(text, { status: res.status })
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) next.headers.set('set-cookie', setCookie)
    next.headers.set('Content-Type', res.headers.get('content-type') || 'application/json')
    return next
  } catch (e) {
    console.error('Upload preview proxy error:', e)
    return NextResponse.json({ error: 'preview failed' }, { status: 500 })
  }
}

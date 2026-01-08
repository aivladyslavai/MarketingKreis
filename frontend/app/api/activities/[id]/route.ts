import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const body = await req.text()
    const resp = await fetch(`${backendUrl}/activities/${params.id}`, {
      method: 'PUT',
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
    console.error('Activities proxy PUT error:', e)
    return NextResponse.json({ detail: 'Proxy error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const resp = await fetch(`${backendUrl}/activities/${params.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', cookie },
    })
    const text = await resp.text()
    const next = new NextResponse(text, { status: resp.status })
    next.headers.set('Content-Type', resp.headers.get('content-type') || 'application/json')
    const setCookie = resp.headers.get('set-cookie')
    if (setCookie) next.headers.set('set-cookie', setCookie)
    return next
  } catch (e) {
    console.error('Activities proxy DELETE error:', e)
    return NextResponse.json({ detail: 'Proxy error' }, { status: 500 })
  }
}



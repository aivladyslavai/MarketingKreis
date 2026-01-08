import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  try {
    const apiUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://kreismarketing-backend.onrender.com').replace(/\/$/, '')
    const r = await fetch(`${apiUrl}/auth/verify?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(15000) : undefined,
    })
    const text = await r.text()
    return new NextResponse(text, { status: r.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}






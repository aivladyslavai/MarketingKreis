import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require backend auth cookies (access_token / refresh_token)
const PROTECTED_PATHS = [
  '/dashboard',
  '/activities',
  '/crm',
  '/calendar',
  '/performance',
  '/budget',
  '/content',
  '/reports',
  '/uploads',
  '/admin',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Legacy /signin → unified auth page
  if (pathname === '/signin') {
    const url = new URL('/signup?mode=login', request.url)
    return NextResponse.redirect(url)
  }

  // Do not intercept Next.js API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Gate protected app routes
  const isProtected = PROTECTED_PATHS.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  )

  if (isProtected) {
    const access = request.cookies.get('access_token')?.value
    const refresh = request.cookies.get('refresh_token')?.value

    if (!access && !refresh) {
      const url = new URL('/signup', request.url)
      url.searchParams.set('mode', 'login')
      url.searchParams.set('redirect', pathname || '/dashboard')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/signin',
    '/signup',
    '/dashboard/:path*',
    '/activities/:path*',
    '/crm/:path*',
    '/calendar/:path*',
    '/performance/:path*',
    '/budget/:path*',
    '/content/:path*',
    '/reports/:path*',
    '/uploads/:path*',
    '/admin/:path*',
  ],
}

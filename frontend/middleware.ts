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

  const isProd = process.env.NODE_ENV === 'production'
  const proto = (request.headers.get('x-forwarded-proto') || request.nextUrl.protocol || '').replace(':', '')

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    // Next.js uses inline JSON/script blocks; keep 'unsafe-inline' for compatibility.
    "script-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https: wss:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join('; ')

  const applySecurityHeaders = (res: NextResponse) => {
    // Baseline browser hardening
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
    res.headers.set('Content-Security-Policy', csp)

    // HSTS only makes sense over HTTPS
    if (isProd && proto === 'https') {
      res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
    return res
  }

  // Legacy /signin → unified auth page
  if (pathname === '/signin') {
    const url = new URL('/signup?mode=login', request.url)
    return applySecurityHeaders(NextResponse.redirect(url))
  }

  // Do not intercept Next.js API routes
  if (pathname.startsWith('/api/')) {
    return applySecurityHeaders(NextResponse.next())
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
      return applySecurityHeaders(NextResponse.redirect(url))
    }
  }

  return applySecurityHeaders(NextResponse.next())
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

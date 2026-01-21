/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['recharts', 'victory-vendor', 'd3-array', 'd3-scale', 'd3-shape'],
  experimental: {
    // Disable automatic package import optimization that breaks some d3 modules
    optimizePackageImports: [],
  },
  eslint: {
    // In production we fail the build on any ESLint errors.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // In production we fail the build on any TS errors.
    ignoreBuildErrors: false,
  },
  async headers() {
    // Centralized browser hardening headers for the frontend.
    const isProd = process.env.NODE_ENV === 'production'
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      // Next.js can rely on inline JSON/script blocks; keep 'unsafe-inline' for compatibility.
      // Allow 'unsafe-eval' only in development (React Fast Refresh / dev tooling).
      `script-src 'self' 'unsafe-inline' ${isProd ? '' : "'unsafe-eval' "}https:`,
      "connect-src 'self' https: wss:",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      'upgrade-insecure-requests',
    ]
      .join('; ')
      .replace(/\s+/g, ' ')
      .trim()

    /** @type {import('next').Headers} */
    const headers = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      { key: 'Content-Security-Policy', value: csp },
    ]

    // HSTS only makes sense in production (served over HTTPS).
    if (isProd) {
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      })
    }

    return [
      {
        source: '/:path*',
        headers,
      },
    ]
  },
  webpack: (config) => {
    // Support @/* alias pointing to project root
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['@'] = require('path').resolve(__dirname)
    return config
  },
  async rewrites() {
    // Only rewrite to local backend during development
    if (process.env.NODE_ENV !== 'development') {
      return []
    }
    const backend = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    console.log('Using backend URL:', backend)
    return [{ source: '/api/:path*', destination: `${backend}/:path*` }]
  },
}

module.exports = nextConfig;



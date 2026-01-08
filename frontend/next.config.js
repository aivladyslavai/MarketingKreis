/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['recharts', 'victory-vendor', 'd3-array', 'd3-scale', 'd3-shape'],
  experimental: {
    // Disable automatic package import optimization that breaks some d3 modules
    optimizePackageImports: [],
  },
  eslint: {
    // Linting запускаем вручную; на Vercel не блокируем сборку.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // In production we fail the build on any TS errors.
    ignoreBuildErrors: false,
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



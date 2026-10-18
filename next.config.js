// @ts-check
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix: silence "multiple lockfiles" workspace root warning from Next.js
  outputFileTracingRoot: path.join(__dirname),
  allowedDevOrigins: [
    '192.168.1.107',
    '192.168.1.107:3000',
    '192.168.1.108',
    '192.168.1.108:3000',
    '192.168.1.111',
    '192.168.1.111:3000',
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
  ],
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: '*.shutterstock.com' },
      { protocol: 'https', hostname: 'www.shutterstock.com' },
    ],
    // Declare quality values used in <Image quality={...}> to avoid Next.js 16 warning
    qualities: [75, 85, 90, 95, 100],
    localPatterns: [
      { pathname: '/uploads/**' },
      { pathname: '/assets/**' },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Cache immutable Next.js static bundles with cache busting
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Static assets & uploads caching with stale-while-revalidate
        source: '/(assets|uploads)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        // Prevent caching sensitive admin + account data
        source: '/(admin|account|checkout|api/admin)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      { source: '/shop.html', destination: '/shop' },
      { source: '/cart.html', destination: '/cart' },
      { source: '/checkout.html', destination: '/checkout' },
      { source: '/login.html', destination: '/login' },
      { source: '/register.html', destination: '/register' },
      { source: '/account.html', destination: '/account' },
      { source: '/tracking.html', destination: '/account/orders' },
      { source: '/refund-policy', destination: '/return-policy' },
      { source: '/refund-policy.html', destination: '/return-policy' },
    ]
  },
}

module.exports = nextConfig
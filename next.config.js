// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
    unoptimized: false,
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
    ]
  },
}

module.exports = nextConfig
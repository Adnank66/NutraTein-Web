import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add security headers to all responses
  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; media-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:;"
  )

  // Protect all /admin/** API routes — must be authenticated as ADMIN
  // Allow public read (GET) for storefront CMS content (announcements, videos, faq, banners)
  const isPublicCmsRead =
    request.method === "GET" &&
    (pathname === "/api/admin/announcement" ||
      pathname === "/api/admin/videos" ||
      pathname === "/api/admin/faq" ||
      pathname === "/api/admin/banners" ||
      pathname === "/api/admin/combos")

  if (pathname.startsWith("/api/admin") && !isPublicCmsRead) {
    const session = await auth()
    const role = (session?.user as any)?.role
    if (!session || role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      )
    }
  }

  // Protect account pages — must be authenticated (any role)
  if (pathname.startsWith("/account") || pathname.startsWith("/checkout")) {
    const session = await auth()
    if (!session) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/account/:path*",
    "/checkout/:path*",
  ],
}

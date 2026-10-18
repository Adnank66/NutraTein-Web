import { handlers } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

export const GET = handlers.GET

// Credentials sign-in is handled by NextAuth rather than a local route, so it
// needs its own throttle. Do not read the body here: NextAuth must receive the
// original request stream to validate the credentials.
export async function POST(req: NextRequest) {
  const pathname = new URL(req.url).pathname
  if (
    pathname.endsWith("/callback/credentials") ||
    pathname.endsWith("/signin/credentials")
  ) {
    const rate = checkRateLimit(`credentials-login:${getClientIdentifier(req)}`, 5, 5 * 60 * 1000)
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many sign-in attempts (max 5 per 5 minutes). Please try again in 5 minutes." },
        { status: 429 }
      )
    }
  }

  return handlers.POST(req)
}

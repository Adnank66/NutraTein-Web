import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export interface AuthSessionUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string | null
}

export interface SecurityCheckResult {
  authorized: boolean
  errorResponse: NextResponse | null
  user: AuthSessionUser | null
  session: any | null
}

/**
 * Reusable server-side helper to ensure the user is logged in.
 * Returns 401 Unauthorized if not authenticated.
 */
export async function requireUser(): Promise<SecurityCheckResult> {
  try {
    const session = await auth()
    if (!session || !session.user || (!session.user.id && !session.user.email)) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { success: false, error: "Unauthorized: Authentication required" },
          { status: 401 }
        ),
        user: null,
        session: null,
      }
    }

    return {
      authorized: true,
      errorResponse: null,
      user: session.user as AuthSessionUser,
      session,
    }
  } catch (err: any) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Authentication verification failed" },
        { status: 500 }
      ),
      user: null,
      session: null,
    }
  }
}

/**
 * Reusable server-side helper to ensure the user has ADMIN role.
 * Returns 401 if logged out, and 403 Forbidden if logged in as normal user.
 */
export async function requireAdmin(): Promise<SecurityCheckResult> {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { success: false, error: "Unauthorized: Authentication required" },
          { status: 401 }
        ),
        user: null,
        session: null,
      }
    }

    const role = (session.user as any)?.role?.toUpperCase()
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { success: false, error: "Forbidden: Admin access required" },
          { status: 403 }
        ),
        user: session.user as AuthSessionUser,
        session,
      }
    }

    return {
      authorized: true,
      errorResponse: null,
      user: session.user as AuthSessionUser,
      session,
    }
  } catch (err: any) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Admin authorization check failed" },
        { status: 500 }
      ),
      user: null,
      session: null,
    }
  }
}

/**
 * Reusable helper for background Cron endpoints.
 * Requires Bearer CRON_SECRET header.
 */
export function requireCronSecret(req: Request): { authorized: boolean; errorResponse: NextResponse | null } {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    // If not configured, block requests by default in production
    if (process.env.NODE_ENV === "production") {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { success: false, error: "CRON_SECRET not configured on server" },
          { status: 500 }
        ),
      }
    }
    return { authorized: true, errorResponse: null }
  }

  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized: Invalid cron authorization token" },
        { status: 401 }
      ),
    }
  }

  return { authorized: true, errorResponse: null }
}

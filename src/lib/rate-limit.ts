/**
 * Lightweight in-memory rate limiter for serverless API routes
 */
interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

export function getClientIdentifier(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

export function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 10 * 60 * 1000 // 10 minutes default
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  // Clean up if window has expired
  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitMap.set(identifier, newRecord)
    return { success: true, remaining: limit - 1, resetTime: newRecord.resetTime }
  }

  // If within window
  if (record.count >= limit) {
    return { success: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count += 1
  return { success: true, remaining: limit - record.count, resetTime: record.resetTime }
}

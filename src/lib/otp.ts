import { createHash, randomInt, timingSafeEqual } from "crypto"

const OTP_PATTERN = /^\d{6}$/

export function generateOtp(): string {
  return randomInt(100000, 1_000_000).toString()
}

export function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex")
}

/**
 * Supports outstanding legacy plaintext records during a one-time rollout while
 * ensuring every newly issued code is stored as a hash.
 */
export function verifyOtp(storedValue: string, suppliedOtp: string): boolean {
  if (!OTP_PATTERN.test(suppliedOtp) || !storedValue) return false

  const expected = Buffer.from(hashOtp(suppliedOtp), "utf8")
  const actual = Buffer.from(storedValue, "utf8")
  if (actual.length === expected.length && timingSafeEqual(actual, expected)) return true

  // Existing unexpired OTP records can still be redeemed during deployment.
  const legacy = Buffer.from(suppliedOtp, "utf8")
  return actual.length === legacy.length && timingSafeEqual(actual, legacy)
}

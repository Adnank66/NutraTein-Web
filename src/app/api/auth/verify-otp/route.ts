import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOtp } from "@/lib/otp"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(`verify-otp:${getClientIdentifier(req)}`, 10, 15 * 60 * 1000)
    if (!rate.success) return NextResponse.json({ error: "Too many verification attempts. Please try again later." }, { status: 429 })

    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and 6-digit verification code are required." },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanCode = code.toString().trim()

    // Read only the latest OTP and compare its stored hash in constant time.
    let otpRecord: any = null
    try {
      const result: any = await prisma.$runCommandRaw({
        find: "EmailOTP",
        filter: { email: cleanEmail },
        sort: { createdAt: -1 },
        limit: 1,
      })
      const docs = result?.cursor?.firstBatch || []
      otpRecord = docs[0] || null
    } catch (e: any) {
      // Fallback to Prisma ORM if raw command fails
      otpRecord = await prisma.emailOTP.findFirst({
        where: { email: cleanEmail },
        orderBy: { createdAt: "desc" },
      })
    }

    if (!otpRecord || !verifyOtp(otpRecord.code, cleanCode)) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check your email and try again." },
        { status: 400 }
      )
    }

    // Check expiry
    const expiresAt = otpRecord.expiresAt?.$date
      ? new Date(otpRecord.expiresAt.$date)
      : new Date(otpRecord.expiresAt)

    if (new Date() > expiresAt) {
      // Delete expired OTP using raw command
      try {
        await prisma.$runCommandRaw({
          delete: "EmailOTP",
          deletes: [{ q: { email: cleanEmail }, limit: 0 }],
        })
      } catch {}
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      )
    }

    // Mark user emailVerified if user exists
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      })
      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerified: new Date() },
        })
      }
    } catch (e) {
      // Non-fatal — verification still succeeds
      console.warn("Could not update emailVerified:", e)
    }

    return NextResponse.json({
      verified: true,
      message: "Email successfully verified!",
    })
  } catch (error: any) {
    console.error("Error verifying OTP")
    return NextResponse.json(
      { error: "Failed to verify code. Please try again." },
      { status: 500 }
    )
  }
}

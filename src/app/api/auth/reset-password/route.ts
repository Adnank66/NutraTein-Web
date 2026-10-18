import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { verifyOtp } from "@/lib/otp"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(`password-reset:${getClientIdentifier(req)}`, 5, 15 * 60 * 1000)
    if (!rate.success) return NextResponse.json({ error: "Too many reset attempts. Please try again later." }, { status: 429 })

    const { email, password, otpCode } = await req.json()

    if (!email || typeof email !== "string" || !password || typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Valid email and password (8-128 characters) are required." },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanCode = String(otpCode || "").trim()

    if (!cleanCode) {
      return NextResponse.json(
        { error: "Verification code (OTP) is required to reset password." },
        { status: 400 }
      )
    }

    // Server-side OTP authorization check
    let otpRecord: any = null
    try {
      otpRecord = await prisma.emailOTP.findFirst({
        where: { email: cleanEmail },
        orderBy: { createdAt: "desc" },
      })
    } catch {
      otpRecord = null
    }

    if (!otpRecord || new Date() > new Date(otpRecord.expiresAt) || !verifyOtp(otpRecord.code, cleanCode)) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Please request a new code." },
        { status: 400 }
      )
    }

    // Delete used OTP immediately to prevent replay attacks
    try {
      await prisma.emailOTP.delete({ where: { id: otpRecord.id } })
    } catch {}

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (!user) {
      // Do not disclose whether the requested account exists.
      return NextResponse.json({ success: true, message: "If an account exists, its password has been updated." })
    }

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { email: cleanEmail },
      data: {
        password: hashed,
        emailVerified: new Date(),
      },
    })

    return NextResponse.json({ success: true, message: "Password updated successfully." })
  } catch (e: any) {
    console.error("Password reset error")
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and 6-digit verification code are required." },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanCode = code.toString().trim()

    // Find latest matching OTP
    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        email: cleanEmail,
        code: cleanCode,
      },
      orderBy: { createdAt: "desc" },
    })

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check your email and try again." },
        { status: 400 }
      )
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await prisma.emailOTP.delete({ where: { id: otpRecord.id } }).catch(() => {})
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      )
    }

    // Code is valid! DO NOT clean up OTP record here, because the register route needs to verify it again.
    // It will be deleted by the register route or cron job when it expires.

    // If an existing user exists with this email, mark emailVerified
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    })

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerified: new Date() },
      })
    }

    return NextResponse.json({
      verified: true,
      message: "Email successfully verified!",
    })
  } catch (error: any) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json(
      { error: error.message || "Failed to verify code. Please try again." },
      { status: 500 }
    )
  }
}

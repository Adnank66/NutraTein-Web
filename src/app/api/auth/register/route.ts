import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { verifyOtp } from "@/lib/otp"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(`register:${getClientIdentifier(req)}`, 5, 15 * 60 * 1000)
    if (!rate.success) return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 })

    const body = await req.json()
    const { name, email, password, phone, otpCode, whatsappOptIn = false } = body

    if (!email || typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanName = typeof name === "string" ? name.trim().slice(0, 100) || "Customer" : "Customer"
    const cleanPhone = typeof phone === "string" ? phone.trim().slice(0, 20) : ""

    if (!password || typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Password must be between 8 and 128 characters long" }, { status: 400 })
    }

    // Email Authorization check via OTP
    if (!otpCode) {
      return NextResponse.json(
        { error: "Please verify your email with the 6-digit code sent to your inbox before proceeding." },
        { status: 400 }
      )
    }

    const otpRecord = await prisma.emailOTP.findFirst({
      where: { email: cleanEmail },
      orderBy: { createdAt: "desc" },
    })

    if (!otpRecord || !verifyOtp(otpRecord.code, String(otpCode).trim())) {
      return NextResponse.json(
        { error: "Invalid verification code. Please request a new code and try again." },
        { status: 400 }
      )
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await prisma.emailOTP.delete({ where: { id: otpRecord.id } }).catch(() => {})
      return NextResponse.json(
        { error: "Verification code has expired. Please click 'Resend Code'." },
        { status: 400 }
      )
    }

    // Delete used OTP
    await prisma.emailOTP.delete({ where: { id: otpRecord.id } }).catch(() => {})

    // Check if email already registered in MongoDB Atlas
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Unable to complete registration with these details." },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        whatsappOptIn: Boolean(whatsappOptIn),
        emailVerified: new Date(),
        password: hashedPassword,
        role: "USER",
      },
    })

    return NextResponse.json({
      message: "Registration successful! Your email is verified.",
      user: { id: user.id, email: user.email, name: user.name },
    }, { status: 201 })
  } catch (err: any) {
    console.error("Registration error")
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    )
  }
}

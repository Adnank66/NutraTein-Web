import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, phone, otpCode, whatsappOptIn = true } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanName = (name || "").trim() || "Customer"
    const cleanPhone = (phone || "").trim()

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Email Authorization check via OTP
    if (!otpCode) {
      return NextResponse.json(
        { error: "Please verify your email with the 6-digit code sent to your inbox before proceeding." },
        { status: 400 }
      )
    }

    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        email: cleanEmail,
        code: otpCode.toString().trim(),
      },
      orderBy: { createdAt: "desc" },
    })

    if (!otpRecord) {
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
        { error: "This email is already registered. Please sign in instead." },
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

    console.log(`✅ Authorized user registered with verified email: ${user.email} (WhatsApp Updates: ${user.whatsappOptIn})`)

    return NextResponse.json({
      message: "Registration successful! Your email is verified.",
      user: { id: user.id, email: user.email, name: user.name },
    }, { status: 201 })
  } catch (err: any) {
    console.error("Registration error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to create account. Please try again." },
      { status: 500 }
    )
  }
}
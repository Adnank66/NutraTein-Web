import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendMail } from "@/lib/sendEmail"

// Basic email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export async function POST(req: Request) {
  try {
    const { email, type = "REGISTER" } = await req.json()

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid, active email address." },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()

    // Helper to prevent Vercel 10s timeout crashes
    const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms))
      ])
    }

    // If registering, check if email is already registered and verified
    if (type === "REGISTER") {
      const existingUser = await withTimeout(
        prisma.user.findUnique({ where: { email: cleanEmail } }),
        4000,
        "Database connection timed out. Please check MongoDB Network Access (0.0.0.0/0)."
      )
      if (existingUser && existingUser.password) {
        return NextResponse.json(
          { error: "This email is already registered. Please sign in instead." },
          { status: 400 }
        )
      }
    }

    // Generate 6-digit numerical OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any previous OTPs for this email
    try {
      await withTimeout(
        prisma.emailOTP.deleteMany({ where: { email: cleanEmail } }),
        3000,
        "DB Timeout"
      )
    } catch (e) {
      // Ignore cleanup error
    }

    // Save new OTP
    await withTimeout(
      prisma.emailOTP.create({
        data: {
          email: cleanEmail,
          code: otp,
          expiresAt,
        },
      }),
      4000,
      "Database connection timed out when saving OTP."
    )

    // Email Template
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #09090b; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ff5722; letter-spacing: 1px;">
            NUTRA<span style="color: #ffffff;">TEIN</span>
          </h1>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1.5px;">Account Verification</p>
        </div>
        
        <div style="padding: 32px 24px; text-align: center; color: #18181b;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 10px 0;">Verify Your Email Address</h2>
          <p style="font-size: 13px; color: #71717a; margin: 0 0 24px 0; line-height: 1.5;">
            Thank you for choosing NUTRA TEIN. Use the 6-digit verification code below to confirm your email and activate your account.
          </p>

          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 24px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #09090b;">
              ${otp}
            </span>
          </div>

          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            This code will expire in <strong>10 minutes</strong>. If you did not request this verification, please disregard this email.
          </p>
        </div>

        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} NUTRA TEIN India • 100% Authentic Supplements
        </div>
      </div>
    `

    // Send email using SMTP
    const mailResult = await withTimeout(
      sendMail(
        cleanEmail,
        `🔑 ${otp} is your NUTRA TEIN Verification Code`,
        html
      ),
      5000,
      "SMTP Email sending timed out. Check your Vercel SMTP environment variables and App Password."
    )

    console.log(`📨 [OTP Sent] Email: ${cleanEmail}, Code: ${otp}, Delivered: ${mailResult.success}`)

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email.",
      devCode: process.env.NODE_ENV !== "production" ? otp : undefined,
    })
  } catch (error: any) {
    console.error("Error sending OTP:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send verification code. Please try again." },
      { status: 500 }
    )
  }
}

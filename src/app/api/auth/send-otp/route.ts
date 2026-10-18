import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendMail } from "@/lib/sendEmail"
import { generateOtp, hashOtp } from "@/lib/otp"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Timeout helper — Atlas M0 cold start can take 8-12s
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT:${label}`)), ms)
    ),
  ])
}

export async function POST(req: Request) {
  try {
    const { email, type = "REGISTER" } = await req.json()

    const rate = checkRateLimit(`email-otp:${getClientIdentifier(req)}`, 5, 15 * 60 * 1000)
    if (!rate.success) return NextResponse.json({ error: "Too many verification requests. Please try again later." }, { status: 429 })

    if (!email || typeof email !== "string" || email.length > 254 || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    if (!['REGISTER', 'LOGIN', 'RESET'].includes(String(type).toUpperCase())) {
      return NextResponse.json({ error: "Unsupported verification request." }, { status: 400 })
    }

    // ── Step 1: Generate a cryptographically secure, short-lived OTP ──
    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // ── Step 2: Delete old OTPs + Insert the hashed OTP via raw commands ──
    // MongoDB M0 Free Tier does NOT support transactions.
    // $runCommandRaw bypasses Prisma's transaction wrapper.
    try {
      await withTimeout(
        prisma.$runCommandRaw({
          delete: "EmailOTP",
          deletes: [{ q: { email: cleanEmail }, limit: 0 }],
        }) as Promise<any>,
        10000,
        "otp-delete"
      )
    } catch (e: any) {
      console.warn("[send-otp] OTP cleanup skipped:", e.message)
    }

    try {
      await withTimeout(
        prisma.$runCommandRaw({
          insert: "EmailOTP",
          documents: [
            {
              email: cleanEmail,
              code: hashOtp(otp),
              expiresAt: { $date: expiresAt.toISOString() },
              createdAt: { $date: new Date().toISOString() },
            },
          ],
        }) as Promise<any>,
        10000,
        "otp-insert"
      )
    } catch (e: any) {
      if (e.message?.startsWith("TIMEOUT:")) {
        return NextResponse.json(
          { error: "Database is slow to respond. Please wait a moment and try again." },
          { status: 503 }
        )
      }
      console.error("[send-otp] OTP insert failed:", e.message)
      return NextResponse.json(
        { error: "Failed to save verification code. Please try again." },
        { status: 500 }
      )
    }

    // ── Step 3: Send email via SMTP ──
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#ffffff;">
        <div style="background:#09090b;padding:24px;text-align:center;">
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#ff5722;letter-spacing:1px;">NUTRA<span style="color:#fff;">TEIN</span></h1>
          <p style="margin:6px 0 0 0;font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:1.5px;">Account Verification</p>
        </div>
        <div style="padding:32px 24px;text-align:center;color:#18181b;">
          <h2 style="font-size:18px;font-weight:700;margin:0 0 10px 0;">Your One-Time Code</h2>
          <p style="font-size:13px;color:#71717a;margin:0 0 24px 0;line-height:1.5;">
            Use the 6-digit code below to verify your email and access your account.
          </p>
          <div style="background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border:2px dashed #cbd5e1;border-radius:12px;padding:20px;margin-bottom:24px;">
            <span style="font-family:monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#09090b;">${otp}</span>
          </div>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            This code expires in <strong>10 minutes</strong>. If you didn't request this, ignore it.
          </p>
        </div>
        <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px;text-align:center;font-size:11px;color:#94a3b8;">
          © ${new Date().getFullYear()} NUTRA TEIN India
        </div>
      </div>`

    try {
      const mailResult = await withTimeout(
        sendMail(cleanEmail, `🔑 ${otp} — Your NUTRA TEIN Verification Code`, html),
        15000,
        "smtp"
      )

      if (!mailResult.success) {
        console.error("[send-otp] Email send failed")
        return NextResponse.json(
          { error: "Email delivery is temporarily unavailable. Please try again later." },
          { status: 500 }
        )
      }
    } catch (e: any) {
      console.error("[send-otp] SMTP error")
      return NextResponse.json(
        { error: "Email delivery is temporarily unavailable. Please try again later." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email.",
    })
  } catch (error: any) {
    console.error("[send-otp] Unexpected error")
    return NextResponse.json(
      { error: "Failed to send verification code. Please try again." },
      { status: 500 }
    )
  }
}

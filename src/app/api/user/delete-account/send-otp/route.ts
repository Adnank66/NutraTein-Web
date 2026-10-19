import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendMail } from "@/lib/sendEmail"
import { generateOtp, hashOtp } from "@/lib/otp"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { requireUser } from "@/lib/security"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const guard = await requireUser()
    if (!guard.authorized || !guard.user?.email) {
      return guard.errorResponse || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rate = checkRateLimit(`delete-account-otp:${getClientIdentifier(req)}`, 3, 10 * 60 * 1000)
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many deletion requests. Please wait before requesting another code." },
        { status: 429 }
      )
    }

    const cleanEmail = guard.user.email.toLowerCase().trim()

    // Query user and enforce user-only deletion
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, name: true, email: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 })
    }

    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase().trim()
    if (user.role === "ADMIN" || cleanEmail === superAdminEmail) {
      return NextResponse.json(
        { error: "Admin accounts cannot be self-deleted. Contact super-admin." },
        { status: 403 }
      )
    }

    // Generate 6-digit OTP
    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete existing OTPs and insert hashed code
    try {
      await prisma.$runCommandRaw({
        delete: "EmailOTP",
        deletes: [{ q: { email: cleanEmail }, limit: 0 }],
      })
    } catch {}

    try {
      await prisma.$runCommandRaw({
        insert: "EmailOTP",
        documents: [
          {
            email: cleanEmail,
            code: hashOtp(otp),
            expiresAt: { $date: expiresAt.toISOString() },
            createdAt: { $date: new Date().toISOString() },
          },
        ],
      })
    } catch (e: any) {
      // Fallback
      await prisma.emailOTP.create({
        data: {
          email: cleanEmail,
          code: hashOtp(otp),
          expiresAt,
        },
      })
    }

    // Send security email
    const subject = "NUTRA TEIN — Account Deletion Verification Code"
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;border:1px solid #fee2e2;border-radius:12px;overflow:hidden;background:#ffffff;">
        <div style="background:#09090b;padding:24px;text-align:center;">
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#ef4444;letter-spacing:1px;">NUTRA<span style="color:#fff;">TEIN</span></h1>
          <p style="margin:6px 0 0 0;font-size:12px;color:#fca5a5;text-transform:uppercase;letter-spacing:1.5px;">Security Verification</p>
        </div>
        <div style="padding:32px 24px;text-align:center;color:#18181b;">
          <div style="display:inline-block;padding:8px 16px;border-radius:999px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;font-size:12px;font-weight:700;margin-bottom:16px;">
            ⚠️ PERMANENT ACCOUNT DELETION REQUEST
          </div>
          <h2 style="font-size:18px;font-weight:700;margin:0 0 10px 0;color:#111827;">Verification Code for Deletion</h2>
          <p style="font-size:13px;color:#4b5563;margin:0 0 24px 0;line-height:1.5;">
            We received a request to permanently delete your NutraTein customer account (<strong>${cleanEmail}</strong>).
            Enter the 6-digit code below to authorize this action:
          </p>
          <div style="background:#fff1f2;border:2px dashed #f43f5e;border-radius:12px;padding:20px;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#e11d48;font-family:monospace;">
              ${otp}
            </span>
          </div>
          <p style="font-size:12px;color:#6b7280;margin:0 0 16px 0;line-height:1.5;">
            ⏱️ This code expires in <strong>10 minutes</strong>. Once confirmed, all your personal data, wishlist, cart, and account details will be irreversibly erased.
          </p>
          <p style="font-size:12px;color:#9ca3af;margin:0;border-top:1px solid #f3f4f6;padding-top:16px;">
            If you did NOT request this, please ignore this email and change your account password immediately.
          </p>
        </div>
      </div>
    `

    await sendMail(cleanEmail, subject, html)

    return NextResponse.json({
      success: true,
      message: `A 6-digit deletion verification code has been sent to ${cleanEmail}.`,
    })
  } catch (err: any) {
    console.error("[delete-account/send-otp] Error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to send verification code. Please try again." },
      { status: 500 }
    )
  }
}

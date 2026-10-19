import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOtp } from "@/lib/otp"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { requireUser } from "@/lib/security"
import { sendMail } from "@/lib/sendEmail"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const guard = await requireUser()
    if (!guard.authorized || !guard.user?.email) {
      return guard.errorResponse || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rate = checkRateLimit(`delete-account-verify:${getClientIdentifier(req)}`, 5, 10 * 60 * 1000)
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait a few minutes." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { code } = body

    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit verification code." },
        { status: 400 }
      )
    }

    const cleanEmail = guard.user.email.toLowerCase().trim()
    const cleanCode = code.trim()

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

    // Verify OTP
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

    // Clear the consumed OTP immediately
    try {
      await prisma.$runCommandRaw({
        delete: "EmailOTP",
        deletes: [{ q: { email: cleanEmail }, limit: 0 }],
      })
    } catch {}

    // ── Cascade Deletion of All User-Owned Data ──
    const userId = user.id

    // 1. Cart & CartItems
    try {
      const userCart = await prisma.cart.findUnique({ where: { userId } })
      if (userCart) {
        await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } })
        await prisma.cart.delete({ where: { id: userCart.id } })
      }
    } catch (e: any) {
      console.warn("[delete-account] Cart deletion note:", e.message)
    }

    // 2. Wishlist & WishlistItems
    try {
      const userWishlist = await prisma.wishlist.findUnique({ where: { userId } })
      if (userWishlist) {
        await prisma.wishlistItem.deleteMany({ where: { wishlistId: userWishlist.id } })
        await prisma.wishlist.delete({ where: { id: userWishlist.id } })
      }
    } catch (e: any) {
      console.warn("[delete-account] Wishlist deletion note:", e.message)
    }

    // 3. Reviews
    try {
      await prisma.review.deleteMany({ where: { userId } })
    } catch (e: any) {
      console.warn("[delete-account] Reviews deletion note:", e.message)
    }

    // 4. Addresses
    try {
      await prisma.address.deleteMany({ where: { userId } })
    } catch (e: any) {
      console.warn("[delete-account] Addresses deletion note:", e.message)
    }

    // 5. Loyalty records
    try {
      await prisma.loyaltyTransaction.deleteMany({ where: { userId } })
      await prisma.loyaltyAccount.deleteMany({ where: { userId } })
    } catch (e: any) {
      console.warn("[delete-account] Loyalty deletion note:", e.message)
    }

    // 6. Subscriptions
    try {
      await prisma.subscription.deleteMany({ where: { userId } })
    } catch (e: any) {
      console.warn("[delete-account] Subscriptions deletion note:", e.message)
    }

    // 7. Orders & OrderItems
    try {
      const userOrders = await prisma.order.findMany({
        where: { userId },
        select: { id: true },
      })
      if (userOrders.length > 0) {
        const orderIds = userOrders.map((o) => o.id)
        await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.order.deleteMany({ where: { userId } })
      }
    } catch (e: any) {
      console.warn("[delete-account] Orders deletion note:", e.message)
    }

    // 8. Sessions & Accounts
    try {
      await prisma.session.deleteMany({ where: { userId } })
      await prisma.account.deleteMany({ where: { userId } })
    } catch (e: any) {
      console.warn("[delete-account] Auth sessions deletion note:", e.message)
    }

    // 9. Notification logs
    try {
      await prisma.notificationLog.deleteMany({ where: { userId } })
    } catch (e: any) {
      console.warn("[delete-account] Notification logs deletion note:", e.message)
    }

    // 10. Finally, delete the User record
    await prisma.user.delete({
      where: { id: userId },
    })

    // Send confirmation email to user
    try {
      const goodbyeHtml = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#ffffff;">
          <div style="background:#09090b;padding:24px;text-align:center;">
            <h1 style="margin:0;font-size:22px;font-weight:900;color:#ea580c;letter-spacing:1px;">NUTRA<span style="color:#fff;">TEIN</span></h1>
          </div>
          <div style="padding:32px 24px;text-align:center;color:#18181b;">
            <h2 style="font-size:18px;font-weight:700;margin:0 0 10px 0;">Account Deleted Successfully</h2>
            <p style="font-size:13px;color:#6b7280;margin:0 0 20px 0;line-height:1.5;">
              Your NutraTein account (<strong>${cleanEmail}</strong>) and all associated personal data have been permanently removed from our system.
            </p>
            <p style="font-size:12px;color:#9ca3af;margin:0;">
              Thank you for having been a part of the NutraTein fitness community. You are always welcome to create a fresh account whenever you choose to return.
            </p>
          </div>
        </div>
      `
      await sendMail(cleanEmail, "Your NUTRA TEIN Account Has Been Deleted", goodbyeHtml)
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Your account and personal data have been permanently deleted.",
    })
  } catch (err: any) {
    console.error("[delete-account] Error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to delete account. Please try again." },
      { status: 500 }
    )
  }
}

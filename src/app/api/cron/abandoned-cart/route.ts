import { prisma } from "@/lib/prisma"
import { sendMail } from "@/lib/sendEmail"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  return handleAbandonedCartRecovery(req)
}

export async function POST(req: Request) {
  return handleAbandonedCartRecovery(req)
}

async function handleAbandonedCartRecovery(req: Request) {
  try {
    const url = new URL(req.url)
    const hoursParam = url.searchParams.get("hours") || "2"
    const hoursThreshold = parseFloat(hoursParam) || 2
    const cutoffTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000)

    // Find carts updated before cutoff time that have items and belong to a registered user
    const carts = await prisma.cart.findMany({
      where: {
        updatedAt: { lte: cutoffTime },
        items: { some: {} },
        user: { isNot: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                basePrice: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: {
              select: {
                flavor: true,
                size: true,
                price: true,
              },
            },
          },
        },
      },
      take: 50,
    })

    let sentCount = 0
    const results = []

    for (const cart of carts) {
      if (!cart.user?.email) continue

      const recipientEmail = cart.user.email
      const customerName = cart.user.name || "Fitness Enthusiast"

      const itemsHtml = cart.items
        .map((item) => {
          const name = item.product?.name || "Supplement"
          const variant = [item.variant?.flavor, item.variant?.size].filter(Boolean).join(" • ")
          const price = item.variant?.price || item.product?.basePrice || 0
          return `
            <tr style="border-bottom: 1px solid #f4f4f5;">
              <td style="padding: 12px 0;">
                <p style="margin: 0; font-weight: 600; color: #18181b; font-size: 14px;">${name}</p>
                ${variant ? `<p style="margin: 2px 0 0; color: #71717a; font-size: 12px;">${variant}</p>` : ""}
              </td>
              <td style="padding: 12px 0; text-align: center; color: #52525b; font-size: 13px;">Qty: ${item.quantity}</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #ea580c; font-size: 14px;">₹${price * item.quantity}</td>
            </tr>
          `
        })
        .join("")

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your PROTEINX Cart is Waiting</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding: 40px 15px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="580" style="max-width:580px; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e4e4e7; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="background:#18181b; padding:24px 30px; text-align:left;">
                      <h2 style="margin:0; color:#ea580c; font-size:22px; font-weight:900; letter-spacing:-0.5px;">PROTEIN<span style="color:#ffffff;">X</span></h2>
                      <p style="margin:4px 0 0; color:#a1a1aa; font-size:12px;">Premium Fitness Supplements</p>
                    </td>
                  </tr>

                  <!-- Hero Body -->
                  <tr>
                    <td style="padding:32px 30px 20px;">
                      <h1 style="margin:0 0 10px; font-size:20px; font-weight:800; color:#18181b;">Hey ${customerName}, you left something behind!</h1>
                      <p style="margin:0 0 20px; color:#52525b; font-size:14px; line-height:1.5;">
                        Your fitness journey can't wait! We noticed you left high-performance supplements in your cart. We've saved them for you so you can pick up right where you left off.
                      </p>

                      <!-- Discount Banner -->
                      <div style="background:#fff7ed; border:1px dashed #ea580c; border-radius:12px; padding:16px; text-align:center; margin-bottom:24px;">
                        <span style="font-size:11px; font-weight:700; color:#ea580c; text-transform:uppercase; letter-spacing:1px;">Limited Time Perk</span>
                        <p style="margin:4px 0; font-size:16px; font-weight:800; color:#9a3412;">Use Code: <span style="background:#ea580c; color:#ffffff; padding:2px 8px; border-radius:6px; font-family:monospace;">SAVE10</span></p>
                        <p style="margin:0; font-size:12px; color:#c2410c;">Get an extra 10% off at checkout today!</p>
                      </div>

                      <!-- Cart Items -->
                      <h3 style="margin:0 0 10px; font-size:13px; font-weight:700; color:#71717a; text-transform:uppercase; letter-spacing:0.5px;">Items in your cart</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                        ${itemsHtml}
                      </table>

                      <!-- CTA Button -->
                      <div style="text-align:center; margin-bottom:24px;">
                        <a href="http://localhost:3000/cart" style="display:inline-block; background:#ea580c; color:#ffffff; text-decoration:none; font-weight:700; font-size:15px; padding:14px 36px; border-radius:12px; box-shadow:0 3px 10px rgba(234,88,12,0.3);">
                          Complete My Order & Save 10% →
                        </a>
                      </div>

                      <p style="margin:0; color:#a1a1aa; font-size:11px; text-align:center;">
                        Need assistance? Reply directly to this email or contact us at adnankazi275@gmail.com / +91 9321598094.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f4f4f5; padding:18px 30px; text-align:center; border-top:1px solid #e4e4e7;">
                      <p style="margin:0; color:#71717a; font-size:11px;">© 2026 PROTEINX Nutrition Inc. Kon Gaon, Kalyan West, Mumbai 421311.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `

      try {
        const mailRes = await sendMail(
          recipientEmail,
          "🛒 Did you forget something? Complete your order & get 10% OFF at PROTEINX",
          html
        )
        if (mailRes.success) {
          sentCount++
          results.push({ email: recipientEmail, status: "sent", messageId: mailRes.messageId })
        } else {
          results.push({ email: recipientEmail, status: "failed", error: mailRes.error })
        }
      } catch (err: any) {
        results.push({ email: recipientEmail, status: "error", error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      cutoffTime: cutoffTime.toISOString(),
      cartsFound: carts.length,
      emailsSent: sentCount,
      details: results,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process cart recovery" }, { status: 500 })
  }
}

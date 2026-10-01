import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

// Razorpay sends webhooks for payment events
export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get("x-razorpay-signature")
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!

    // Verify webhook signature
    if (signature && webhookSecret) {
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex")
      if (expectedSig !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
      }
    }

    const event = JSON.parse(body)

    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity
      if (payment) {
        const receipt = payment.order_id
        // Find order by razorpay order reference in notes or receipt
        const notes = payment.notes || {}
        const orderNumber = notes.orderNumber || notes.order_number

        if (orderNumber) {
          await prisma.order.update({
            where: { orderNumber },
            data: { paymentStatus: "PAID", status: "CONFIRMED" },
          })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("Webhook error:", err)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

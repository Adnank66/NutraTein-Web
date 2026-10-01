import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderNumber,
    } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment parameters" }, { status: 400 })
    }

    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex")

    const isValid = expectedSignature === razorpay_signature

    if (!isValid) {
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 })
    }

    // Update order in database — mark as PAID
    if (orderNumber) {
      await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      })

      // Also update Payment record
      const order = await prisma.order.findUnique({ where: { orderNumber } })
      if (order) {
        await prisma.payment.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            amount: order.totalAmount,
            currency: "INR",
            status: "PAID",
            method: "RAZORPAY",
            transactionId: razorpay_payment_id,
            gatewayResponse: JSON.stringify({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
            }),
          },
          update: {
            status: "PAID",
            transactionId: razorpay_payment_id,
            gatewayResponse: JSON.stringify({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
            }),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
    })
  } catch (err: any) {
    console.error("Razorpay verify error:", err)
    return NextResponse.json(
      { error: err.message || "Payment verification failed" },
      { status: 500 }
    )
  }
}

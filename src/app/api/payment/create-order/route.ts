import { NextResponse } from "next/server"
import Razorpay from "razorpay"

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: Request) {
  try {
    const { amount, currency = "INR", orderNumber, notes } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Razorpay amount is in paise (multiply by 100)
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: orderNumber || `receipt_${Date.now()}`,
      notes: notes || {},
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    })
  } catch (err: any) {
    console.error("Razorpay create order error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to create payment order" },
      { status: 500 }
    )
  }
}

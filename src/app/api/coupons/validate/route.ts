import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { code, orderAmount } = await req.json()

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 404 })
    }

    if (orderAmount < coupon.minOrderValue) {
      return NextResponse.json(
        { error: `Minimum order of ₹${coupon.minOrderValue} required for this coupon` },
        { status: 400 }
      )
    }

    let discountAmount = 0
    if (coupon.discountType === "PERCENT") {
      discountAmount = (orderAmount * coupon.discountValue) / 100
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount
      }
    } else {
      discountAmount = coupon.discountValue
    }

    return NextResponse.json({
      code: coupon.code,
      discountAmount: Math.round(discountAmount),
      description: coupon.description,
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Validation error" }, { status: 500 })
  }
}
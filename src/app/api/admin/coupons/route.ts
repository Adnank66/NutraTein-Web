import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== "ADMIN") {
      // allow internal admin read
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ success: true, coupons })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      usageLimit,
      expiresAt,
      isActive = true,
      productId,
      productName,
      productImage,
    } = body

    if (!code || !discountValue) {
      return NextResponse.json({ error: "Code and discount value are required" }, { status: 400 })
    }

    const normalizedCode = code.toUpperCase().trim()

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    })

    if (existing) {
      return NextResponse.json({ error: "A promo code with this name already exists" }, { status: 409 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        description: description || null,
        discountType: discountType === "FIXED" ? "FIXED" : "PERCENT",
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue || 0),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: Boolean(isActive),
        productId: productId || null,
        productName: productName || null,
        productImage: productImage || null,
      },
    })

    return NextResponse.json({ success: true, coupon }, { status: 201 })
  } catch (error: any) {
    console.error("Create coupon error:", error)
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, isActive, ...updateFields } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 })
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(updateFields.discountValue ? { discountValue: Number(updateFields.discountValue) } : {}),
        ...(updateFields.minOrderValue !== undefined ? { minOrderValue: Number(updateFields.minOrderValue) } : {}),
        ...(updateFields.productId !== undefined ? { productId: updateFields.productId } : {}),
        ...(updateFields.productName !== undefined ? { productName: updateFields.productName } : {}),
        ...(updateFields.productImage !== undefined ? { productImage: updateFields.productImage } : {}),
      },
    })

    return NextResponse.json({ success: true, coupon: updated })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 })
    }

    await prisma.coupon.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: "Coupon deleted" })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 })
  }
}

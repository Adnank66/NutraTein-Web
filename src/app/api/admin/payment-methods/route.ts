import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

// GET: List all configured UPI payment methods from MongoDB Atlas
export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
    }

    const methods = await prisma.paymentMethod.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ success: true, methods })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch payment methods" },
      { status: 500 }
    )
  }
}

// POST: Create or update a UPI payment method in MongoDB Atlas
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
    }

    const body = await req.json()
    const { id, upiId, payeeName, qrImageUrl, instructions, label, isDefault, isActive } = body

    if (!upiId || !payeeName) {
      return NextResponse.json(
        { error: "UPI ID and Payee Name are required" },
        { status: 400 }
      )
    }

    // If this method is set as default, unset other defaults
    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    let result
    if (id && /^[a-f\d]{24}$/i.test(id)) {
      result = await prisma.paymentMethod.update({
        where: { id },
        data: {
          upiId: upiId.trim(),
          payeeName: payeeName.trim(),
          qrImageUrl: qrImageUrl ? String(qrImageUrl).trim().replace(/\\/g, "/") : "/assets/payment/upi-qr.svg",
          instructions: instructions || "Scan the QR code with any UPI app and enter the 12-digit UTR/Txn reference below.",
          label: label || "Primary Store UPI",
          isDefault: Boolean(isDefault),
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      })
    } else {
      // Check if this is the first method, make it default if so
      const count = await prisma.paymentMethod.count()
      const shouldBeDefault = isDefault || count === 0

      result = await prisma.paymentMethod.create({
        data: {
          upiId: upiId.trim(),
          payeeName: payeeName.trim(),
          qrImageUrl: qrImageUrl ? String(qrImageUrl).trim().replace(/\\/g, "/") : "/assets/payment/upi-qr.svg",
          instructions: instructions || "Scan the QR code with any UPI app and enter the 12-digit UTR/Txn reference below.",
          label: label || `UPI Profile #${count + 1}`,
          isDefault: shouldBeDefault,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      })
    }

    return NextResponse.json({ success: true, method: result })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save payment method" },
      { status: 500 }
    )
  }
}

// DELETE: Delete a UPI payment method by ID
export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Valid ID required" }, { status: 400 })
    }

    await prisma.paymentMethod.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Payment method deleted successfully" })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete payment method" },
      { status: 500 }
    )
  }
}

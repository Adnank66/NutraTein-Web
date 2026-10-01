import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getBackupOrders } from "@/lib/orders-store"
import { withFastTimeout } from "@/lib/fast-data"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = (searchParams.get("q") || "").trim()

    if (!query) {
      return NextResponse.json({ success: false, error: "Order number or email is required" }, { status: 400 })
    }

    let foundOrder: any = null

    // 1. Try DB lookup by orderNumber or ID
    try {
      const isObjectId = /^[a-f\d]{24}$/i.test(query)
      const isEmail = query.includes("@")

      const dbOrders = await withFastTimeout(
        prisma.order.findMany({
          where: {
            OR: [
              { orderNumber: { equals: query } },
              ...(isObjectId ? [{ id: query }] : []),
              ...(isEmail ? [{ user: { email: query.toLowerCase() } }] : []),
            ],
          },
          include: {
            items: true,
            address: true,
          },
          orderBy: { createdAt: "desc" },
          take: isEmail ? 5 : 1,
        }),
        [],
        1500
      )

      if (dbOrders && dbOrders.length > 0) {
        foundOrder = dbOrders
      }
    } catch {
      foundOrder = null
    }

    // 2. Fallback to backup store if DB missed
    if (!foundOrder || foundOrder.length === 0) {
      const backups = getBackupOrders()
      const isEmail = query.includes("@")
      const matched = backups.filter((b: any) => {
        if (isEmail) return b.userEmail?.toLowerCase() === query.toLowerCase()
        return (
          b.orderNumber?.toLowerCase() === query.toLowerCase() ||
          b.id?.toLowerCase() === query.toLowerCase()
        )
      })

      if (matched.length > 0) {
        foundOrder = matched
      }
    }

    if (!foundOrder || foundOrder.length === 0) {
      return NextResponse.json({ success: false, error: "No matching order found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      orders: Array.isArray(foundOrder) ? foundOrder : [foundOrder],
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to track order" },
      { status: 500 }
    )
  }
}

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getBackupOrders } from "@/lib/orders-store"
import { withFastTimeout } from "@/lib/fast-data"

export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let dbOrders: any[] = []
    try {
      dbOrders = await withFastTimeout(
        prisma.order.findMany({
          include: {
            user: { select: { name: true, email: true, phone: true } },
            items: true,
            address: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        [],
        2500
      )
    } catch {
      dbOrders = []
    }

    const backupOrders = getBackupOrders()
    const allMap = new Map<string, any>()
    for (const o of dbOrders) allMap.set(o.orderNumber, o)
    for (const b of backupOrders) {
      if (!allMap.has(b.orderNumber)) allMap.set(b.orderNumber, b)
    }

    const orders = Array.from(allMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ success: true, count: orders.length, orders })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch orders" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId, status } = await req.json()
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    })

    return NextResponse.json({ message: "Order status updated", order: updated })
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
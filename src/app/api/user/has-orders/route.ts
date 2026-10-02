import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getBackupOrders } from "@/lib/orders-store"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ hasOrders: false, orderCount: 0 })
  }

  const userId = session.user.id
  const userEmail = session.user.email?.toLowerCase().trim()

  try {
    const isObjectId = userId && /^[a-f\d]{24}$/i.test(userId)
    const count = await prisma.order.count({
      where: {
        OR: [
          ...(isObjectId ? [{ userId }] : []),
          ...(userEmail ? [{ user: { email: userEmail } }, { customerEmail: userEmail }] : []),
        ],
      },
    })

    if (count > 0) {
      return NextResponse.json({ hasOrders: true, orderCount: count })
    }

    // Fallback check in backup orders store
    const backupOrders = getBackupOrders()
    const matchingBackup = backupOrders.filter((b) => {
      const bEmail = (b.customer?.email || b.user?.email || "").toLowerCase().trim()
      return (userEmail && bEmail === userEmail) || (userId && b.userId === userId)
    })

    return NextResponse.json({
      hasOrders: matchingBackup.length > 0,
      orderCount: matchingBackup.length,
    })
  } catch (error) {
    console.error("Error checking user orders:", error)
    return NextResponse.json({ hasOrders: false, orderCount: 0 })
  }
}

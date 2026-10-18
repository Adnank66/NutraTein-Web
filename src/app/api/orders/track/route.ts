import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getBackupOrders } from "@/lib/orders-store"
import { withFastTimeout } from "@/lib/fast-data"
import { requireUser } from "@/lib/security"

function maskString(str?: string | null, visibleStart = 2, visibleEnd = 2): string {
  if (!str) return ""
  if (str.length <= visibleStart + visibleEnd) return "*".repeat(str.length)
  return str.slice(0, visibleStart) + "*".repeat(str.length - visibleStart - visibleEnd) + str.slice(-visibleEnd)
}

function maskPhone(phone?: string | null): string {
  if (!phone) return ""
  const clean = phone.replace(/\s+/g, "")
  if (clean.length <= 4) return "****"
  return "*".repeat(clean.length - 4) + clean.slice(-4)
}

function sanitizeOrderForPublic(order: any) {
  return {
    ...order,
    customerEmail: maskString(order.customerEmail, 2, 4),
    customerPhone: maskPhone(order.customerPhone),
    user: order.user ? {
      name: maskString(order.user.name, 1, 1),
      email: maskString(order.user.email, 2, 4),
    } : null,
    address: order.address ? {
      city: order.address.city,
      state: order.address.state,
      pincode: order.address.pincode,
      country: order.address.country,
      name: maskString(order.address.name, 1, 1),
      phone: maskPhone(order.address.phone),
      houseFlat: "************",
      street: "************",
    } : null,
  }
}

export async function GET(req: Request) {
  try {
    const guard = await requireUser()
    if (!guard.authorized || !guard.user?.id || !guard.user.email) return guard.errorResponse!

    const sessionUserId = guard.user.id
    const sessionEmail = guard.user.email.toLowerCase().trim()
    const isAdmin = guard.user.role === "ADMIN"

    const { searchParams } = new URL(req.url)
    const query = (searchParams.get("q") || "").trim()

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Order number or tracking ID is required" },
        { status: 400 }
      )
    }

    const isEmailQuery = query.includes("@")

    // A customer can list only their own history; admins retain support access.
    if (isEmailQuery) {
      if (!isAdmin && sessionEmail !== query.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: "Unauthorized access to other customer records" },
          { status: 403 }
        )
      }
    }

    let foundOrders: any[] = []

    // 1. Database Lookup
    try {
      const isObjectId = /^[a-f\d]{24}$/i.test(query)
      const dbOrders = await withFastTimeout(
        prisma.order.findMany({
          where: {
            OR: [
              { orderNumber: { equals: query } },
              ...(isObjectId ? [{ id: query }] : []),
              ...(isEmailQuery ? [{ user: { email: query.toLowerCase() } }, { customerEmail: query.toLowerCase() }] : []),
            ],
          },
          include: {
            items: true,
            address: true,
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: isEmailQuery ? 10 : 1,
        }),
        [],
        2500
      )

      if (dbOrders && dbOrders.length > 0) {
        foundOrders = dbOrders
      }
    } catch {
      foundOrders = []
    }

    // 2. Backup Store Fallback
    if (foundOrders.length === 0) {
      const backups = getBackupOrders()
      const matched = backups.filter((b: any) => {
        const bEmail = (b.customerEmail || b.userEmail || b.customer?.email || "").toLowerCase().trim()
        if (isEmailQuery) return bEmail === query.toLowerCase()
        return (
          b.orderNumber?.toLowerCase() === query.toLowerCase() ||
          b.id?.toLowerCase() === query.toLowerCase()
        )
      })

      if (matched.length > 0) {
        foundOrders = matched
      }
    }

    if (foundOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: "No matching order found" },
        { status: 404 }
      )
    }

    // 3. Strict ownership check. A request-body/query email is never accepted as
    // proof of ownership because it can be changed by the caller.
    const authorizedOrders = foundOrders.map((order) => {
      const orderUserId = order.userId
      const orderEmail = (order.customerEmail || order.userEmail || order.user?.email || "").toLowerCase().trim()

      const isOwner = Boolean(
        (sessionUserId && orderUserId && sessionUserId === orderUserId) ||
        // Local backup records predate the userId field; their e-mail may only
        // be compared with the authenticated session identity.
        (!orderUserId && sessionEmail && orderEmail && sessionEmail === orderEmail)
      )

      if (!isAdmin && !isOwner) {
        return null
      }
      return order
    })

    if (authorizedOrders.some((order) => order === null)) {
      return NextResponse.json({ success: false, error: "Unauthorized access to this order" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      orders: authorizedOrders,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to track order" },
      { status: 500 }
    )
  }
}

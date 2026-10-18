import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/security"
import { sendMail } from "@/lib/sendEmail"
import { updateBackupOrderStatus } from "@/lib/orders-store"

export async function POST(req: Request) {
  try {
    const guard = await requireUser()
    if (!guard.authorized || !guard.user?.id) return guard.errorResponse!

    const { orderNumber, reason } = await req.json()

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 })
    }

    const cleanOrderNumber = String(orderNumber).trim()
    const cleanReason = String(reason || "Customer requested cancellation").trim()

    // 1. Find the order in MongoDB
    const order = await prisma.order.findUnique({
      where: { orderNumber: cleanOrderNumber },
      include: { user: true, address: true, items: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Security check: strict ownership verification
    const isAdmin = guard.user.role === "ADMIN"
    const orderEmail = (order.customerEmail || order.user?.email || "").toLowerCase().trim()

    if (!isAdmin && order.userId !== guard.user.id) {
      return NextResponse.json(
        { error: "Unauthorized: You do not have permission to cancel this order" },
        { status: 403 }
      )
    }

    // 2. Validate current status allows cancellation
    if (["DELIVERED", "CANCELLED", "RETURNED"].includes(order.deliveryStatus) || order.status === "CANCELLED") {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${order.deliveryStatus || order.status}` },
        { status: 400 }
      )
    }

    if (order.status === "CANCEL_REQUESTED" || order.deliveryStatus === "CANCEL_REQUESTED") {
      return NextResponse.json(
        { error: "A cancellation request for this order is already pending approval." },
        { status: 400 }
      )
    }

    // 3. Update order in database
    const history = Array.isArray(order.deliveryStatusHistory)
      ? [...order.deliveryStatusHistory]
      : []
    history.push({
      status: "CANCEL_REQUESTED",
      timestamp: new Date().toISOString(),
      note: `Customer cancellation request: ${cleanReason}`,
    })

    const updated = await prisma.order.update({
      where: { orderNumber: cleanOrderNumber },
      data: {
        status: "CANCEL_REQUESTED",
        deliveryStatus: "CANCEL_REQUESTED",
        notes: cleanReason,
        deliveryStatusHistory: history,
      },
    })

    // Also update backup file
    updateBackupOrderStatus(cleanOrderNumber, "CANCEL_REQUESTED", undefined, {
      deliveryStatus: "CANCEL_REQUESTED",
    })

    const targetCustomerEmail = orderEmail || guard.user.email || ""
    const adminEmail = process.env.ALERT_EMAIL || process.env.ADMIN_EMAIL

    // 4. Send email notification to Customer
    sendMail(
      targetCustomerEmail,
      `Cancellation Request Received: Order #${cleanOrderNumber} - NUTRA TEIN`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px;">
        <h2 style="color: #dc2626; margin-top: 0;">Order Cancellation Request Received</h2>
        <p>Hello <strong>${order.address?.name || order.user?.name || "Valued Customer"}</strong>,</p>
        <p>We have received your cancellation request for Order <strong>#${cleanOrderNumber}</strong>.</p>
        <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Reason:</strong> ${cleanReason}</p>
          <p style="margin: 0;"><strong>Status:</strong> Pending Admin Review</p>
        </div>
        <p>Our dispatch manager will review your request shortly. You will receive an email once the request is approved or updated.</p>
        <p style="color: #71717a; font-size: 12px; margin-top: 30px;">
          NUTRA TEIN Customer Support | Email: adnankazi275@gmail.com | Phone: +91 9321598094
        </p>
      </div>
      `
    ).catch((err) => console.warn("Customer cancel request email notice:", err))

    // 5. Send notification to Admin (Adnan Kazi)
    if (adminEmail) sendMail(
      adminEmail,
      `🔔 Alert: Cancellation Requested for Order #${cleanOrderNumber}`,
      `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Order Cancellation Request Alert</h2>
        <p>A customer has requested cancellation for Order <strong>#${cleanOrderNumber}</strong>.</p>
        <p><strong>Customer:</strong> ${order.address?.name || order.user?.name || "Customer"}</p>
        <p><strong>Email:</strong> ${targetCustomerEmail}</p>
        <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
        <p><strong>Reason:</strong> ${cleanReason}</p>
        <p>Please review and accept or reject this request in the <a href="https://nutratein.in/admin/orders">Admin Panel Orders Section</a>.</p>
      </div>
      `
    ).catch(() => console.warn("Admin cancel alert notice"))

    return NextResponse.json({
      success: true,
      message: "Cancellation request submitted successfully. You will receive an email confirmation.",
      order: updated,
    })
  } catch (error: any) {
    console.error("Order cancellation error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to submit cancellation request" },
      { status: 500 }
    )
  }
}

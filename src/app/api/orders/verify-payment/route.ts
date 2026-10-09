import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { sendMail } from "@/lib/sendEmail"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const { orderNumber, orderId, transactionId, amount } = body

    if (!orderNumber && !orderId) {
      return NextResponse.json({ error: "Order identifier required" }, { status: 400 })
    }

    const cleanTxnId = (transactionId || "").trim()
    if (!cleanTxnId) {
      return NextResponse.json({ error: "Please enter a valid Transaction ID or UTR number" }, { status: 400 })
    }

    // Lookup order in MongoDB Atlas
    const isHex = orderId && /^[a-f\d]{24}$/i.test(orderId)
    const order = await prisma.order.findFirst({
      where: isHex ? { id: orderId } : { orderNumber },
      include: { payment: true, user: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Update Payment record in MongoDB Atlas
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          transactionId: cleanTxnId,
          status: "PENDING",
        },
      })
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: amount || order.totalAmount,
          currency: "INR",
          status: "PENDING",
          method: "UPI",
          transactionId: cleanTxnId,
        },
      })
    }

    // Append to Order deliveryStatusHistory audit log
    const currentHistory = Array.isArray(order.deliveryStatusHistory)
      ? (order.deliveryStatusHistory as any[])
      : []

    const auditEntry = {
      status: "PAYMENT_SUBMITTED",
      timestamp: new Date().toISOString(),
      note: `Customer submitted UPI UTR / Transaction ID: ${cleanTxnId}. Awaiting bank verification.`,
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PENDING",
        deliveryStatusHistory: [auditEntry, ...currentHistory],
        notes: order.notes
          ? `${order.notes} | Customer UTR: ${cleanTxnId}`
          : `Customer UTR: ${cleanTxnId}`,
      },
    })

    // Notify Administrator via email
    try {
      const adminHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px 24px; color: #ffffff;">
            <h2 style="margin: 0; color: #f59e0b; font-size: 18px;">🔔 NEW UPI PAYMENT VERIFICATION REQUIRED</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">Order #${order.orderNumber}</p>
          </div>
          <div style="padding: 24px; color: #1e293b;">
            <p>A customer has submitted a UPI payment reference for verification:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
              <tr><td style="padding: 8px 0; color: #64748b;">Order Number:</td><td style="font-weight: bold;">#${order.orderNumber}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b;">Amount:</td><td style="font-weight: bold; color: #059669;">₹${order.totalAmount}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b;">Customer:</td><td>${order.customerEmail || order.user?.email || "Guest"} (${order.customerPhone || "N/A"})</td></tr>
              <tr style="background: #fef3c7;"><td style="padding: 10px 8px; color: #92400e; font-weight: bold;">Submitted UTR / Txn ID:</td><td style="padding: 10px 8px; font-weight: 800; font-family: monospace; color: #b45309; font-size: 14px;">${cleanTxnId}</td></tr>
            </table>
            <p style="font-size: 12px; color: #64748b;">Please check your bank statement and verify the order in your Admin Orders view.</p>
          </div>
        </div>
      `
      sendMail("adnankazi275@gmail.com", `Verify UPI Payment: Order #${order.orderNumber} (UTR: ${cleanTxnId})`, adminHtml).catch(() => {})
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Transaction reference ${cleanTxnId} successfully submitted for verification.`,
      transactionId: cleanTxnId,
    })
  } catch (err: any) {
    console.error("verify-payment route error:", err)
    return NextResponse.json({ error: err.message || "Failed to submit verification" }, { status: 500 })
  }
}

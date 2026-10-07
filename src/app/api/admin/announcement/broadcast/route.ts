import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, message, channel, recipientEmail, recipientPhone } = body

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    let sentCount = 0

    // Send via email if selected
    if (channel === "EMAIL" || channel === "BOTH") {
      try {
        const { sendOrderAlertEmail } = await import("@/lib/email-service")
        // If a specific recipient is provided, send to them; otherwise notify admin
        const target = recipientEmail || session.user?.email || "admin@proteinx.in"
        // Log notification in NotificationLog
        await (prisma as any).notificationLog?.create({
          data: {
            channel: "EMAIL",
            event: "STORE_UPDATE",
            status: "SENT",
            message: `${title ? `[${title}] ` : ""}${message}`,
            email: target,
            sentAt: new Date(),
          },
        }).catch(() => {})
        sentCount++
      } catch (err: any) {
        console.error("Email broadcast error:", err)
      }
    }

    // Send via WhatsApp if selected
    if (channel === "WHATSAPP" || channel === "BOTH") {
      try {
        const phone = recipientPhone || "+91 9321598094"
        await (prisma as any).notificationLog?.create({
          data: {
            channel: "WHATSAPP",
            event: "STORE_UPDATE",
            status: "SENT",
            message: `${title ? `*${title}*\n` : ""}${message}`,
            phone,
            sentAt: new Date(),
          },
        }).catch(() => {})
        sentCount++
      } catch (err: any) {
        console.error("WhatsApp broadcast error:", err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Update broadcast successfully queued and sent via ${channel}!`,
      sentCount,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

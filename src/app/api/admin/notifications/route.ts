import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/security"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  try {
    const notifications = await prisma.siteNotification.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ notifications })
  } catch {
    return NextResponse.json({ notifications: [] })
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  try {
    const { title, message, type = "OFFER", link, badge, isActive = true } = await req.json()

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    const notification = await prisma.siteNotification.create({
      data: {
        title,
        message,
        type,
        link: link || null,
        badge: badge || null,
        isActive,
      },
    })

    return NextResponse.json({ notification })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create notification" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "Notification ID required" }, { status: 400 })

    await prisma.siteNotification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to delete notification" }, { status: 500 })
  }
}

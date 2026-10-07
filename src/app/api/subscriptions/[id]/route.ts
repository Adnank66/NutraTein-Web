import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const body = await req.json()
  const { action, frequency, quantity, cancelReason } = body

  try {
    const sub = await (prisma as any).subscription.findUnique({ where: { id } })
    if (!sub || sub.userId !== user.id) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    let updateData: any = {}
    if (action === "pause") updateData.status = "PAUSED"
    if (action === "resume") updateData.status = "ACTIVE"
    if (action === "cancel") { updateData.status = "CANCELLED"; updateData.cancelReason = cancelReason || "User cancelled" }
    if (action === "skip") {
      const days = { BIWEEKLY: 14, MONTHLY: 30, BIMONTHLY: 60, QUARTERLY: 90 }[sub.frequency as string] || 30
      const next = new Date(sub.nextDeliveryDate)
      next.setDate(next.getDate() + days)
      updateData.nextDeliveryDate = next
    }
    if (frequency) updateData.frequency = frequency
    if (quantity) updateData.quantity = parseInt(quantity)

    const updated = await (prisma as any).subscription.update({ where: { id }, data: updateData })
    return NextResponse.json({ success: true, subscription: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

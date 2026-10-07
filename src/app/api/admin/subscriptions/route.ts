import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  const where: any = {}
  if (status && status !== "ALL") where.status = status

  try {
    const subscriptions = await (prisma as any).subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    const userIds = subscriptions.map((s: any) => s.userId)
    const productIds = subscriptions.map((s: any) => s.productId)
    const [users, products] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }),
      prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
    ])

    const userMap = Object.fromEntries(users.map(u => [u.id, u]))
    const productMap = Object.fromEntries(products.map(p => [p.id, p]))

    const enriched = subscriptions.map((s: any) => ({
      ...s,
      user: userMap[s.userId] || null,
      product: productMap[s.productId] || null,
    }))

    return NextResponse.json({ success: true, subscriptions: enriched })
  } catch (err: any) {
    return NextResponse.json({ success: true, subscriptions: [], note: err.message })
  }
}

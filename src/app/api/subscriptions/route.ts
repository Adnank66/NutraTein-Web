import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const FREQUENCY_DAYS: Record<string, number> = {
  BIWEEKLY: 14,
  MONTHLY: 30,
  BIMONTHLY: 60,
  QUARTERLY: 90,
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  try {
    const subscriptions = await (prisma as any).subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })

    // Enrich with product info
    const productIds = subscriptions.map((s: any) => s.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { images: { where: { isPrimary: true }, take: 1 }, variants: true },
    })
    const productMap = Object.fromEntries(products.map(p => [p.id, p]))

    const enriched = subscriptions.map((s: any) => ({
      ...s,
      product: productMap[s.productId] || null,
    }))

    return NextResponse.json({ success: true, subscriptions: enriched })
  } catch (err: any) {
    return NextResponse.json({ success: true, subscriptions: [], note: err.message })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const body = await req.json()
  const { productId, variantId, quantity, frequency, addressId } = body

  // Validate product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    include: { variants: true },
  })
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

  // Get price
  let basePrice = product.basePrice
  if (variantId) {
    const variant = product.variants.find(v => v.id === variantId)
    if (variant) basePrice = variant.price
  }

  const days = FREQUENCY_DAYS[frequency] || 30
  const nextDeliveryDate = new Date()
  nextDeliveryDate.setDate(nextDeliveryDate.getDate() + days)

  try {
    const subscription = await (prisma as any).subscription.create({
      data: {
        userId: user.id,
        productId,
        variantId: variantId || null,
        quantity: parseInt(quantity) || 1,
        frequency: frequency || "MONTHLY",
        discountPercent: 10, // Default 10% subscribe & save
        basePrice,
        status: "ACTIVE",
        nextDeliveryDate,
        addressId: addressId || null,
      },
    })
    return NextResponse.json({ success: true, subscription })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

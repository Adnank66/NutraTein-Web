import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const bundles = await prisma.bundle.findMany({
      orderBy: { createdAt: "desc" }
    }) || []
    
    // Enrich with product names
    const productIds = [...new Set(bundles.flatMap((b: any) => [b.productId, ...b.relatedIds]))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, basePrice: true }
    })
    const productMap = Object.fromEntries(products.map(p => [p.id, p]))
    
    const enriched = bundles.map((b: any) => ({
      ...b,
      product: productMap[b.productId] || null,
      relatedProducts: b.relatedIds.map((id: string) => productMap[id]).filter(Boolean)
    }))
    
    return NextResponse.json({ success: true, bundles: enriched })
  } catch (err: any) {
    return NextResponse.json({ success: true, bundles: [], note: err.message })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { productId, relatedIds, discountPercent } = await req.json()
    if (!productId || !relatedIds?.length) {
      return NextResponse.json({ error: "productId and relatedIds required" }, { status: 400 })
    }
    
    const existing = await prisma.bundle.findFirst({
      where: { productId }
    })

    let bundle
    if (existing) {
      bundle = await prisma.bundle.update({
        where: { id: existing.id },
        data: { relatedIds, discountPercent: discountPercent || 0 }
      })
    } else {
      bundle = await prisma.bundle.create({
        data: { productId, relatedIds, discountPercent: discountPercent || 0 }
      })
    }
    
    return NextResponse.json({ success: true, bundle })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  try {
    await prisma.bundle.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

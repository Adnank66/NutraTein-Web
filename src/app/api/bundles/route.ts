import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

  try {
    const bundle = await prisma.bundle.findFirst({
      where: { productId, isActive: true },
    })

    if (!bundle || !bundle.relatedIds?.length) {
      return NextResponse.json({ success: true, bundle: null, products: [] })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: bundle.relatedIds }, isActive: true },
      include: { images: { where: { isPrimary: true }, take: 1 } },
    })

    return NextResponse.json({ success: true, bundle, products })
  } catch (err) {
    return NextResponse.json({ success: true, bundle: null, products: [] })
  }
}

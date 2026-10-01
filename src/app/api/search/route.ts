import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""

    if (!q) return NextResponse.json({ products: [], categories: [] })

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q } },
            { brand: { contains: q } },
            { tags: { contains: q } },
          ],
        },
        select: { id: true, name: true, slug: true, brand: true, basePrice: true },
        take: 6,
      }),
      prisma.category.findMany({
        where: { name: { contains: q } },
        select: { id: true, name: true, slug: true },
        take: 3,
      }),
    ])

    return NextResponse.json({ products, categories })
  } catch (err: any) {
    return NextResponse.json({ products: [], categories: [] })
  }
}
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createCachedETagResponse } from "@/lib/cache"

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true }, orderBy: { price: "asc" } },
        category: true,
        reviews: {
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return createCachedETagResponse(req, { data: product }, "public, s-maxage=120, stale-while-revalidate=600")
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}
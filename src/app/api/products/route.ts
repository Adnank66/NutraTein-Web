import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createCachedETagResponse } from "@/lib/cache"
import { withFastTimeout, getFallbackProducts } from "@/lib/fast-data"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: any = { isActive: true }
    if (category) {
      const catObj = await prisma.category.findUnique({ where: { slug: category } })
      if (catObj && catObj.type === "GOAL" && catObj.linkedCategorySlug) {
        where.category = { slug: catObj.linkedCategorySlug }
      } else {
        where.category = { slug: category }
      }
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { tags: { contains: search } },
      ]
    }

    const products = await withFastTimeout(
      prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true }, orderBy: { price: "asc" } },
          category: true,
        },
        orderBy: { isBestSeller: "desc" },
      }),
      getFallbackProducts() as any,
      800
    )

    return createCachedETagResponse(req, { data: products || getFallbackProducts() }, "public, s-maxage=60, stale-while-revalidate=300")
  } catch (error: any) {
    return createCachedETagResponse(req, { data: getFallbackProducts() }, "public, s-maxage=60, stale-while-revalidate=300")
  }
}
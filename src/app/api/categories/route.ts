import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getOrSetCache, createCachedETagResponse } from "@/lib/cache"
import { withFastTimeout } from "@/lib/fast-data"

const FALLBACK_CATEGORIES = [
  { id: "cat-whey", name: "Whey Protein", slug: "whey-protein", type: "PRODUCT", sortOrder: 1 },
  { id: "cat-creatine", name: "Creatine", slug: "creatine", type: "PRODUCT", sortOrder: 2 },
  { id: "cat-mass", name: "Mass Gainers", slug: "mass-gainers", type: "PRODUCT", sortOrder: 3 },
  { id: "cat-preworkout", name: "Pre-Workout", slug: "pre-workout", type: "PRODUCT", sortOrder: 4 },
  { id: "cat-fatburner", name: "Fat Burner", slug: "fat-burner", type: "PRODUCT", sortOrder: 5 },
  { id: "cat-sports", name: "Sports Supplements", slug: "sports-supplements", type: "PRODUCT", sortOrder: 6 },
  { id: "cat-muscle", name: "Muscle Building", slug: "muscle-building", type: "GOAL", sortOrder: 7 },
  { id: "cat-weightloss", name: "Weight Loss", slug: "weight-loss", type: "GOAL", sortOrder: 8 },
  { id: "cat-energy", name: "Energy & Endurance", slug: "energy-endurance", type: "GOAL", sortOrder: 9 },
]

export async function GET(req: Request) {
  try {
    const categories = await getOrSetCache("all_categories", 300, async () => {
      return withFastTimeout(
        prisma.category.findMany({
          include: { _count: { select: { products: true } } },
          orderBy: { sortOrder: "asc" },
        }),
        FALLBACK_CATEGORIES,
        800
      )
    })

    return createCachedETagResponse(
      req,
      { success: true, categories: categories || FALLBACK_CATEGORIES, data: categories || FALLBACK_CATEGORIES },
      "public, s-maxage=300, stale-while-revalidate=1800"
    )
  } catch {
    return createCachedETagResponse(
      req,
      { success: true, categories: FALLBACK_CATEGORIES, data: FALLBACK_CATEGORIES },
      "public, s-maxage=300, stale-while-revalidate=1800"
    )
  }
}
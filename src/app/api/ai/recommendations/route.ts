import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getAllCatalogProducts } from "@/data/products-catalog"
import { withFastTimeout } from "@/lib/fast-data"

// Complementary supplement pairing rules (athletic stack synergy)
const SYNERGY_MAP: Record<string, string[]> = {
  // Whey Protein pairs best with Creatine, Pre-Workout, or Shakers
  "whey-protein": ["creatine", "pre-workout", "bcaa-eaa"],
  "nitro-tein-whey-isolate": ["creatine-monohydrate", "ignition-pre-workout"],
  "shred-tein-whey": ["l-carnitine-3000-liquid", "ignition-pre-workout"],
  // Creatine pairs best with Whey or Pre-workout
  "creatine": ["whey-protein", "pre-workout", "mass-gainers"],
  "creatine-monohydrate": ["nitro-tein-whey-isolate", "ignition-pre-workout"],
  // Mass Gainer pairs with Creatine or Multivitamins
  "mass-gainers": ["creatine", "bcaa-eaa"],
  "mass-tein-gainer": ["creatine-monohydrate"],
  // Pre-workout pairs with BCAA or Whey
  "pre-workout": ["bcaa-eaa", "whey-protein"],
  "ignition-pre-workout": ["nitro-tein-whey-isolate", "creatine-monohydrate"],
  // L-Carnitine pairs with Shred Whey or Pre-workout
  "l-carnitine-3000-liquid": ["shred-tein-whey", "ignition-pre-workout"],
}

// Goal to category / product keywords mapping
const GOAL_PREFERENCES: Record<string, { categories: string[]; keywords: string[] }> = {
  muscle_building: {
    categories: ["whey-protein", "creatine"],
    keywords: ["whey", "isolate", "creatine", "protein"],
  },
  fat_loss: {
    categories: ["plant-protein", "pre-workout"],
    keywords: ["carnitine", "shred", "lean", "burn"],
  },
  bulking: {
    categories: ["mass-gainers", "creatine"],
    keywords: ["mass", "gainer", "carbs", "bulk"],
  },
  strength: {
    categories: ["creatine", "pre-workout"],
    keywords: ["creatine", "pre-workout", "pump", "power"],
  },
  endurance: {
    categories: ["bcaa-eaa", "pre-workout"],
    keywords: ["bcaa", "eaa", "amino", "recovery"],
  },
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const context = searchParams.get("context") || "home" // home | product | cart
    const currentProductId = searchParams.get("productId")
    const currentSlug = searchParams.get("slug")
    const cartIdsParam = searchParams.get("cartProductIds")
    const viewedIdsParam = searchParams.get("viewedProductIds")
    const goal = searchParams.get("goal") // muscle_building | fat_loss | bulking | strength | endurance
    const limit = parseInt(searchParams.get("limit") || "4", 10)

    const cartProductIds = cartIdsParam ? cartIdsParam.split(",").filter(Boolean) : []
    const viewedProductIds = viewedIdsParam ? viewedIdsParam.split(",").filter(Boolean) : []

    // 1. Check user session for past orders
    let sessionUser: any = null
    try {
      const session = await auth()
      if (session?.user?.email) {
        sessionUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            orders: {
              where: { status: { not: "CANCELLED" } },
              orderBy: { createdAt: "desc" },
              take: 5,
              include: {
                items: {
                  include: {
                    product: {
                      include: { category: true },
                    },
                  },
                },
              },
            },
          },
        })
      }
    } catch {
      sessionUser = null
    }

    // Extract categories user has previously purchased
    const purchasedCategories = new Set<string>()
    const purchasedProductIds = new Set<string>()
    if (sessionUser?.orders) {
      for (const order of sessionUser.orders) {
        for (const item of order.items) {
          if (item.productId) purchasedProductIds.add(item.productId)
          if (item.product?.category?.slug) purchasedCategories.add(item.product.category.slug)
        }
      }
    }

    // 2. Fetch active catalog products from database (with fallback)
    const catalogFallback = getAllCatalogProducts()
    let dbProducts: any[] = []

    try {
      dbProducts = await withFastTimeout(
        prisma.product.findMany({
          where: { isActive: true },
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
            category: true,
          },
          take: 30,
        }),
        [],
        350
      )
    } catch {
      dbProducts = []
    }

    // Map to normalized items
    const allProducts = dbProducts.length > 0
      ? dbProducts.map((p) => {
          const v = p.variants[0]
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand,
            price: v?.price ?? p.basePrice,
            mrp: p.mrp,
            discountPercent: p.discountPercent,
            rating: p.rating,
            reviewCount: p.reviewCount,
            image: p.images[0]?.url || "/assets/products/whey.jpg",
            category: p.category?.name || "Supplements",
            categorySlug: p.category?.slug || "",
            stock: v?.stock ?? 50,
            shortDescription: p.shortDesc,
            isBestSeller: p.isBestSeller,
            isNew: p.isNew,
          }
        })
      : catalogFallback.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          brand: c.brand,
          price: c.price,
          mrp: c.mrp,
          discountPercent: c.discount,
          rating: c.rating,
          reviewCount: c.reviewCount,
          image: c.image,
          category: c.category,
          categorySlug: c.category.toLowerCase().replace(/\s+/g, "-"),
          stock: 50,
          shortDescription: c.description,
          isBestSeller: true,
          isNew: false,
        }))

    // 3. Score products based on context and signals
    const scoredProducts = allProducts.map((prod) => {
      let score = 0
      const reasons: string[] = []

      // Exclude current product or already in cart
      if (currentProductId && (prod.id === currentProductId || prod.slug === currentSlug)) {
        return { product: prod, score: -999, reasons: [] }
      }
      if (cartProductIds.includes(prod.id)) {
        return { product: prod, score: -999, reasons: [] }
      }

      // Signal A: Frequently Bought Together / Synergy (High Weight: +40)
      if (currentSlug && SYNERGY_MAP[currentSlug]?.includes(prod.slug)) {
        score += 45
        reasons.push("Frequently paired with current item")
      }
      if (cartProductIds.length > 0) {
        for (const cid of cartProductIds) {
          const cartItem = allProducts.find((p) => p.id === cid)
          if (cartItem) {
            if (SYNERGY_MAP[cartItem.slug]?.includes(prod.slug)) {
              score += 40
              reasons.push(`Frequently bought with ${cartItem.name}`)
            }
            if (SYNERGY_MAP[cartItem.categorySlug]?.includes(prod.categorySlug)) {
              score += 25
              reasons.push("Perfect stack addition to cart")
            }
          }
        }
      }

      // Signal B: Fitness Goal matching (Weight: +35)
      if (goal && GOAL_PREFERENCES[goal]) {
        const pref = GOAL_PREFERENCES[goal]
        if (pref.categories.includes(prod.categorySlug)) {
          score += 35
          reasons.push(`Targeted for ${goal.replace("_", " ")}`)
        }
        if (pref.keywords.some((kw) => prod.name.toLowerCase().includes(kw))) {
          score += 15
        }
      }

      // Signal C: User's Past Orders (Weight: +25)
      if (purchasedCategories.size > 0) {
        // Recommend complementary categories rather than duplicate exact same product
        for (const cat of purchasedCategories) {
          if (SYNERGY_MAP[cat]?.includes(prod.categorySlug)) {
            score += 25
            reasons.push("Complements your previous orders")
          }
        }
        // If user already bought this category, give modest affinity
        if (purchasedCategories.has(prod.categorySlug)) {
          score += 10
        }
      }

      // Signal D: Browsing History (Weight: +20)
      if (viewedProductIds.includes(prod.id)) {
        score += 20
        reasons.push("Based on items you viewed")
      }

      // Signal E: Product Quality Baseline (Rating & Best Seller)
      score += (prod.rating || 4.5) * 4
      if (prod.isBestSeller) score += 10

      return {
        product: prod,
        score,
        reasons: reasons.length > 0 ? reasons : ["Top rated by athletes"],
      }
    })

    // Filter out excluded items and sort by highest score
    const recommendations = scoredProducts
      .filter((sp) => sp.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((sp) => ({
        ...sp.product,
        recommendationReason: sp.reasons[0],
      }))

    return NextResponse.json({
      success: true,
      context,
      goal: goal || null,
      count: recommendations.length,
      recommendations,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate recommendations" },
      { status: 500 }
    )
  }
}

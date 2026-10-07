import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import fs from "fs"
import path from "path"

const REVIEWS_FILE = path.join(process.cwd(), "src", "data", "site-reviews.json")

function getSiteReviews(): any[] {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      return JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf-8"))
    }
  } catch (err) {}
  return []
}

function saveSiteReviews(reviews: any[]) {
  try {
    const dir = path.dirname(REVIEWS_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf-8")
  } catch (err) {}
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawProductId = searchParams.get("productId")
    const ratingParam = searchParams.get("rating")
    const verifiedParam = searchParams.get("verified")
    const limitParam = searchParams.get("limit")

    let resolvedProductId: string | undefined = undefined

    if (rawProductId && rawProductId !== "all" && rawProductId !== "undefined") {
      // Check if it's a 24-char hex MongoDB ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(rawProductId)) {
        resolvedProductId = rawProductId
      } else {
        // Try looking up product by slug
        const prod = await prisma.product.findUnique({
          where: { slug: rawProductId },
          select: { id: true },
        })
        if (prod) {
          resolvedProductId = prod.id
        }
      }
    }

    const scopeWhere: any = {
      status: { not: "REJECTED" },
    }
    if (resolvedProductId) {
      scopeWhere.productId = resolvedProductId
    }

    // 1. Calculate overall summary dynamically from the database for this scope
    let allScopeReviews: any[] = []
    try {
      allScopeReviews = await prisma.review.findMany({
        where: scopeWhere,
        select: {
          id: true,
          rating: true,
          isVerified: true,
        },
      })
    } catch (e) {
      allScopeReviews = []
    }

    const limit = limitParam ? Math.min(Number(limitParam), 100) : 50

    // 2. Build filtered query for the list of reviews
    const filterWhere: any = { ...scopeWhere }
    if (ratingParam && !isNaN(Number(ratingParam))) {
      filterWhere.rating = Number(ratingParam)
    }
    if (verifiedParam === "true") {
      filterWhere.isVerified = true
    }

    let rawReviews: any[] = []
    try {
      rawReviews = await prisma.review.findMany({
        where: filterWhere,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      })
    } catch (e) {
      rawReviews = []
    }

    let reviews = rawReviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product?.name || "NUTRATEIN Supplement",
      productSlug: r.product?.slug || "",
      rating: r.rating,
      title: r.title || "",
      body: r.body || "",
      isVerified: r.isVerified,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      customerName: r.user?.name || "Verified Athlete",
    }))

    // 3. If homepage/all-scope reviews, also merge approved site reviews from JSON
    if (!resolvedProductId) {
      const siteReviews = getSiteReviews()
        .filter((r: any) => r.status === "APPROVED" || r.status === "PENDING") // Show approved/pending on store
        .map((r: any) => ({
          id: r.id,
          productId: "store",
          productName: "NUTRATEIN Official",
          productSlug: "",
          rating: Number(r.rating) || 5,
          title: r.title || "",
          body: r.body || "",
          isVerified: Boolean(r.isVerified ?? true),
          createdAt: r.createdAt || new Date().toISOString(),
          customerName: r.user?.name || r.name || "Verified Athlete",
        }))

      reviews = [...reviews, ...siteReviews].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime() || 0
        const dateB = new Date(b.createdAt).getTime() || 0
        return dateB - dateA
      }).slice(0, limit)
    }

    const totalReviews = reviews.length
    const totalRatingSum = reviews.reduce((sum, r) => sum + r.rating, 0)
    const averageRating = totalReviews > 0 ? Math.round((totalRatingSum / totalReviews) * 10) / 10 : 5.0

    const breakdown = [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => r.rating === star).length
      const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
      return { star, count, percentage }
    })

    const fiveStarPercentage = breakdown.find((b) => b.star === 5)?.percentage || 100

    return NextResponse.json({
      reviews,
      summary: {
        averageRating,
        totalReviews,
        fiveStarPercentage,
        breakdown,
      },
    })
  } catch (error: any) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({
      reviews: [],
      summary: {
        averageRating: 5.0,
        totalReviews: 0,
        fiveStarPercentage: 100,
        breakdown: [
          { star: 5, count: 0, percentage: 0 },
          { star: 4, count: 0, percentage: 0 },
          { star: 3, count: 0, percentage: 0 },
          { star: 2, count: 0, percentage: 0 },
          { star: 1, count: 0, percentage: 0 },
        ],
      },
    })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const { productId, rating, title, body, name, email } = await req.json()

    if (!rating || !body) {
      return NextResponse.json({ error: "Missing required review fields" }, { status: 400 })
    }

    // If review is a general store review or no productId provided
    if (!productId || productId === "store" || productId === "general") {
      const siteReviews = getSiteReviews()
      const newSiteReview = {
        id: Date.now().toString(),
        rating: Number(rating),
        title: title || "",
        body,
        status: "PENDING",
        isVerified: !!session,
        createdAt: new Date().toISOString(),
        user: {
          name: session?.user?.name || name || "Verified Athlete",
          email: session?.user?.email || email || "",
        },
        product: {
          name: "Store Review",
          slug: "",
        },
      }
      siteReviews.push(newSiteReview)
      saveSiteReviews(siteReviews)

      return NextResponse.json({
        success: true,
        message: "Review submitted for approval",
        review: newSiteReview,
      })
    }

    // Otherwise, link to Product in DB
    let targetProductId = productId
    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      const prod = await prisma.product.findUnique({
        where: { slug: productId },
        select: { id: true },
      })
      if (prod) {
        targetProductId = prod.id
      }
    }

    let userId = session?.user?.id
    if (!userId) {
      const demoUser = await prisma.user.findFirst({ where: { role: "USER" } })
      userId = demoUser?.id
    }

    if (!userId) {
      // Fallback: save to site reviews if no DB user exists
      const siteReviews = getSiteReviews()
      const newReview = {
        id: Date.now().toString(),
        rating: Number(rating),
        title: title || "",
        body,
        status: "PENDING",
        isVerified: false,
        createdAt: new Date().toISOString(),
        user: { name: name || "Customer", email: email || "" },
        product: { name: productId, slug: productId },
      }
      siteReviews.push(newReview)
      saveSiteReviews(siteReviews)
      return NextResponse.json({ success: true, message: "Review recorded", review: newReview })
    }

    const review = await prisma.review.create({
      data: {
        productId: targetProductId,
        userId,
        rating: Number(rating),
        title: title || "",
        body,
        isVerified: !!session,
        status: "PENDING",
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      message: "Review added successfully",
      review: {
        id: review.id,
        productId: review.productId,
        productName: review.product?.name || "NUTRATEIN Supplement",
        rating: review.rating,
        title: review.title,
        body: review.body,
        isVerified: review.isVerified,
        createdAt: review.createdAt.toISOString(),
        customerName: review.user?.name || "Verified Athlete",
      },
    })
  } catch (err: any) {
    console.error("Error creating review:", err)
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 })
  }
}
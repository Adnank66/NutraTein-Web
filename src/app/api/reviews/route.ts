import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

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
    const allScopeReviews = await prisma.review.findMany({
      where: scopeWhere,
      select: {
        id: true,
        rating: true,
        isVerified: true,
      },
    })

    const totalReviews = allScopeReviews.length
    const totalRatingSum = allScopeReviews.reduce((sum, r) => sum + r.rating, 0)
    const averageRating = totalReviews > 0 ? Math.round((totalRatingSum / totalReviews) * 10) / 10 : 0

    const breakdown = [5, 4, 3, 2, 1].map((star) => {
      const count = allScopeReviews.filter((r) => r.rating === star).length
      const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
      return { star, count, percentage }
    })

    const fiveStarPercentage = breakdown.find((b) => b.star === 5)?.percentage || 0

    // 2. Build filtered query for the list of reviews
    const filterWhere: any = { ...scopeWhere }
    if (ratingParam && !isNaN(Number(ratingParam))) {
      filterWhere.rating = Number(ratingParam)
    }
    if (verifiedParam === "true") {
      filterWhere.isVerified = true
    }

    const limit = limitParam ? Math.min(Number(limitParam), 100) : 50

    const rawReviews = await prisma.review.findMany({
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

    const reviews = rawReviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product?.name || "NUTRATEIN Supplement",
      productSlug: r.product?.slug || "",
      rating: r.rating,
      title: r.title || "",
      body: r.body || "",
      isVerified: r.isVerified,
      createdAt: r.createdAt.toISOString(),
      customerName: r.user?.name || "Verified Athlete",
    }))

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
    return NextResponse.json(
      {
        reviews: [],
        summary: {
          averageRating: 0,
          totalReviews: 0,
          fiveStarPercentage: 0,
          breakdown: [
            { star: 5, count: 0, percentage: 0 },
            { star: 4, count: 0, percentage: 0 },
            { star: 3, count: 0, percentage: 0 },
            { star: 2, count: 0, percentage: 0 },
            { star: 1, count: 0, percentage: 0 },
          ],
        },
        error: "Failed to load customer reviews",
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const { productId, rating, title, body } = await req.json()

    if (!productId || !rating || !body) {
      return NextResponse.json({ error: "Missing required review fields" }, { status: 400 })
    }

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
      // Find or assign demo customer
      const demoUser = await prisma.user.findFirst({ where: { role: "USER" } })
      userId = demoUser?.id
    }

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const review = await prisma.review.create({
      data: {
        productId: targetProductId,
        userId,
        rating: Number(rating),
        title: title || "",
        body,
        isVerified: true,
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true } },
      },
    })

    // Update product overall rating & review count
    const allReviews = await prisma.review.findMany({ where: { productId: targetProductId } })
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

    await prisma.product.update({
      where: { id: targetProductId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
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
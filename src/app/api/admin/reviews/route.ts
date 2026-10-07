import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

export async function GET() {
  try {
    // 1. Fetch DB product reviews
    let dbReviews: any[] = []
    try {
      dbReviews = await prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { name: true, slug: true } },
        },
      })
    } catch (e) {
      dbReviews = []
    }

    const formattedDbReviews = dbReviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: r.status,
      isVerified: r.isVerified,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      user: r.user || { name: "Customer", email: "" },
      product: r.product || { name: "NUTRATEIN Product", slug: "" },
      reviewType: "PRODUCT",
    }))

    // 2. Fetch site reviews from JSON
    const siteReviews = getSiteReviews().map((r) => ({
      ...r,
      reviewType: "SITE",
      product: r.product || { name: "Store / Homepage Review", slug: "" },
      user: r.user || { name: r.name || "Customer", email: r.email || "" },
    }))

    // Combine and sort by createdAt desc
    const allReviews = [...formattedDbReviews, ...siteReviews].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime() || 0
      const dateB = new Date(b.createdAt).getTime() || 0
      return dateB - dateA
    })

    return NextResponse.json({ reviews: allReviews })
  } catch (e: any) {
    return NextResponse.json({ reviews: [] })
  }
}

export async function PATCH(req: Request) {
  const err = await requireAdmin()
  if (err) return err
  try {
    const { id, status, title, body } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    // Check if review is in site-reviews.json
    const siteReviews = getSiteReviews()
    const siteIdx = siteReviews.findIndex((r: any) => String(r.id) === String(id))

    if (siteIdx > -1) {
      if (status !== undefined) siteReviews[siteIdx].status = status
      if (title !== undefined) siteReviews[siteIdx].title = title
      if (body !== undefined) siteReviews[siteIdx].body = body
      saveSiteReviews(siteReviews)
      return NextResponse.json({ success: true, review: siteReviews[siteIdx] })
    }

    // Otherwise update in DB
    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(title !== undefined && { title }),
        ...(body !== undefined && { body }),
      },
    })
    return NextResponse.json({ success: true, review })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const err = await requireAdmin()
  if (err) return err
  try {
    const body = await req.json().catch(() => ({}))
    const { searchParams } = new URL(req.url)
    const id = body.id || searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    // Check site reviews first
    const siteReviews = getSiteReviews()
    const siteIdx = siteReviews.findIndex((r: any) => String(r.id) === String(id))
    if (siteIdx > -1) {
      const filtered = siteReviews.filter((r: any) => String(r.id) !== String(id))
      saveSiteReviews(filtered)
      return NextResponse.json({ success: true })
    }

    // Otherwise delete from Prisma DB
    await prisma.review.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

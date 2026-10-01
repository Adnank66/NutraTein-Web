import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET all products (admin)
export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const products = await prisma.product.findMany({
      include: { category: true, images: { where: { isPrimary: true }, take: 1 }, variants: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ success: true, products })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST create new product
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name, slug, brand, description, shortDesc, basePrice, mrp, discountPercent,
      categoryId, howToUse, ingredients, benefits, nutritionInfo, tags,
      isFeatured, isBestSeller, isNew, isActive,
      images = [], variants = [],
    } = body

    // Validate required fields
    if (!name || !slug || !categoryId || !basePrice) {
      return NextResponse.json({ error: "name, slug, categoryId, and basePrice are required" }, { status: 400 })
    }

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: `Slug "${slug}" is already taken. Use a different slug.` }, { status: 409 })
    }

    // Create product with images and variants
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        brand: brand?.trim() || "NUTRATEIN",
        description: description?.trim() || "",
        shortDesc: shortDesc?.trim() || undefined,
        basePrice: Number(basePrice),
        mrp: Number(mrp) || Number(basePrice),
        discountPercent: Number(discountPercent) || 0,
        categoryId,
        howToUse: howToUse?.trim() || undefined,
        ingredients: ingredients?.trim() || undefined,
        benefits: benefits?.trim() || undefined,
        nutritionInfo: nutritionInfo?.trim() || undefined,
        tags: tags?.trim() || undefined,
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        isNew: Boolean(isNew),
        isActive: Boolean(isActive),
        images: {
          create: images.map((img: any, idx: number) => ({
            url: img.url,
            alt: img.alt || name,
            isPrimary: img.isPrimary || idx === 0,
            sortOrder: img.sortOrder ?? idx,
          })),
        },
        variants: {
          create: variants.map((v: any) => ({
            flavor: v.flavor?.trim() || undefined,
            size: v.size?.trim() || undefined,
            sku: v.sku.trim(),
            price: Number(v.price) || Number(basePrice),
            stock: Number(v.stock) || 0,
            isActive: true,
          })),
        },
      },
      include: { images: true, variants: true, category: true },
    })

    return NextResponse.json({ success: true, product })
  } catch (err: any) {
    console.error("Create product error:", err)
    // Handle unique constraint on SKU
    if (err.message?.includes("Unique constraint") || err.code === "P2002") {
      return NextResponse.json(
        { error: "A variant SKU already exists. Please use unique SKUs." },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: err.message || "Failed to create product" }, { status: 500 })
  }
}

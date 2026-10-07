import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json({ success: true, categories })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, slug, type, linkedCategorySlug, description, image, icon, sortOrder } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: cleanSlug,
        type: type === "GOAL" ? "GOAL" : "PRODUCT",
        linkedCategorySlug: linkedCategorySlug?.trim() || null,
        description: description?.trim() || null,
        image: image?.trim() || null,
        icon: icon?.trim() || null,
        sortOrder: typeof sortOrder === "number" ? sortOrder : 10,
      },
    })

    return NextResponse.json({ success: true, category })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create category" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, name, slug, type, linkedCategorySlug, description, image, icon, sortOrder } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (type !== undefined) updateData.type = type === "GOAL" ? "GOAL" : "PRODUCT"
    if (linkedCategorySlug !== undefined) updateData.linkedCategorySlug = linkedCategorySlug?.trim() || null
    if (slug !== undefined) {
      updateData.slug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    }
    if (description !== undefined) updateData.description = description
    if (image !== undefined) updateData.image = image
    if (icon !== undefined) updateData.icon = icon
    if (typeof sortOrder === "number") updateData.sortOrder = sortOrder

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, category })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 })
    }

    // Check if category has products
    const productCount = await prisma.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: ${productCount} products are assigned to it. Reassign or delete products first.` },
        { status: 400 }
      )
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Category deleted" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete category" }, { status: 500 })
  }
}

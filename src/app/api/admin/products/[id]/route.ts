import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { isPrimary: "desc" } },
        variants: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, product })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch product" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      name,
      slug,
      brand,
      description,
      shortDescription,
      categoryId,
      basePrice,
      mrp,
      discountPercent,
      isFeatured,
      isBestSeller,
      isNew,
      isActive,
      images,
      variants,
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (brand !== undefined) updateData.brand = brand
    if (description !== undefined) updateData.description = description
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (typeof basePrice === "number") updateData.basePrice = basePrice
    if (typeof mrp === "number") updateData.mrp = mrp
    if (typeof discountPercent === "number") updateData.discountPercent = discountPercent
    if (typeof isFeatured === "boolean") updateData.isFeatured = isFeatured
    if (typeof isBestSeller === "boolean") updateData.isBestSeller = isBestSeller
    if (typeof isNew === "boolean") updateData.isNew = isNew
    if (typeof isActive === "boolean") updateData.isActive = isActive

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    })

    // Update images if provided
    if (Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId: id } })
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        await prisma.productImage.create({
          data: {
            productId: id,
            url: typeof img === "string" ? img : img.url,
            isPrimary: typeof img === "object" ? !!img.isPrimary : i === 0,
          },
        })
      }
    }

    // Update variants if provided
    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.id && !v.id.startsWith("new-")) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              flavor: v.flavor ?? null,
              size: v.size ?? null,
              price: typeof v.price === "number" ? v.price : Number(v.price) || 0,
              stock: typeof v.stock === "number" ? Math.max(0, v.stock) : Number(v.stock) || 0,
              sku: v.sku || undefined,
            },
          })
        } else if (v.sku) {
          await prisma.productVariant.create({
            data: {
              productId: id,
              flavor: v.flavor ?? null,
              size: v.size ?? null,
              price: typeof v.price === "number" ? v.price : Number(v.price) || 0,
              stock: typeof v.stock === "number" ? Math.max(0, v.stock) : Number(v.stock) || 0,
              sku: v.sku,
            },
          })
        }
      }
    }

    return NextResponse.json({ success: true, message: "Product updated successfully", product: updatedProduct })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.productVariant.deleteMany({ where: { productId: id } })
    await prisma.productImage.deleteMany({ where: { productId: id } })
    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Product deleted permanently" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete product" }, { status: 500 })
  }
}

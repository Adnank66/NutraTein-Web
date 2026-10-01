import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const isAdmin = (session?.user as any)?.role === "ADMIN" || process.env.NODE_ENV === "development"
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { products } = body

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products provided in payload" }, { status: 400 })
    }

    // Cache existing categories or create default
    let defaultCategory = await prisma.category.findFirst()
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: {
          name: "Proteins",
          slug: "proteins",
          description: "High quality premium protein supplements",
        },
      })
    }

    const createdList = []
    const errors = []

    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      try {
        if (!p.name || !p.basePrice) {
          errors.push(`Row ${i + 1}: Missing name or base price`)
          continue
        }

        const baseSlug = (p.slug || p.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`

        let catId = defaultCategory.id
        if (p.category) {
          const categorySlug = p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          let cat = await prisma.category.findFirst({
            where: { slug: categorySlug },
          })
          if (!cat) {
            cat = await prisma.category.create({
              data: {
                name: p.category,
                slug: categorySlug,
                description: `${p.category} supplements`,
              },
            })
          }
          catId = cat.id
        }

        const basePrice = parseFloat(p.basePrice) || 0
        const mrp = parseFloat(p.mrp) || Math.round(basePrice * 1.25)
        const discountPercent = mrp > basePrice ? Math.round(((mrp - basePrice) / mrp) * 100) : 0
        const stock = parseInt(p.stock, 10) || 50
        const sku = p.sku || `SKU-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`

        const newProduct = await prisma.product.create({
          data: {
            name: p.name,
            slug: uniqueSlug,
            brand: p.brand || "PROTEINX",
            description: p.description || `${p.name} - Premium quality fitness supplement.`,
            shortDesc: p.shortDesc || "Pure nutrition for maximum performance.",
            categoryId: catId,
            basePrice,
            mrp,
            discountPercent,
            isActive: true,
            images: {
              create: [
                {
                  url: p.imageUrl || "/assets/products/whey.jpg",
                  alt: p.name,
                  isPrimary: true,
                },
              ],
            },
            variants: {
              create: [
                {
                  flavor: p.flavor || "Chocolate",
                  size: p.size || "1 kg",
                  sku,
                  price: basePrice,
                  stock,
                  isActive: true,
                },
              ],
            },
          },
        })

        createdList.push(newProduct)
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${p.name}): ${err.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdList.length} product(s)`,
      importedCount: createdList.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Bulk upload failed" }, { status: 500 })
  }
}

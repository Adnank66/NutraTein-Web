import { prisma } from "@/lib/prisma"

export async function getProducts(category?: string) {
  try {
    const where: any = { isActive: true }
    if (category) {
      where.category = { slug: category }
    }
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        mrp: true,
        discountPercent: true,
        category: { select: { name: true } },
        ingredients: true,
        benefits: true,
        nutritionInfo: true,
        howToUse: true,
        tags: true,
        variants: true,
        images: { take: 1, select: { url: true } }
      },
      take: 20
    })
    
    return products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.basePrice,
      mrp: p.mrp,
      discount: p.discountPercent,
      category: p.category?.name,
      ingredients: p.ingredients,
      benefits: p.benefits,
      nutritionInfo: p.nutritionInfo,
      howToUse: p.howToUse,
      tags: p.tags,
      variants: p.variants,
      image: p.images[0]?.url || "",
      inStock: true
    }))
  } catch (err: any) {
    console.error("Error in getProducts:", err)
    return []
  }
}

export async function searchProducts(query: string) {
  try {
    const cleanQuery = (query || "").trim()
    const where: any = { isActive: true }
    if (cleanQuery && cleanQuery.toLowerCase() !== "all products" && cleanQuery.toLowerCase() !== "all") {
      where.OR = [
        { name: { contains: cleanQuery, mode: "insensitive" } },
        { tags: { contains: cleanQuery, mode: "insensitive" } },
        { benefits: { contains: cleanQuery, mode: "insensitive" } },
        { description: { contains: cleanQuery, mode: "insensitive" } }
      ]
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        mrp: true,
        discountPercent: true,
        category: { select: { name: true } },
        variants: true,
        images: { take: 1, select: { url: true } }
      },
      take: 10
    })

    return products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.basePrice,
      mrp: p.mrp,
      discount: p.discountPercent,
      category: p.category?.name,
      variants: p.variants,
      image: p.images[0]?.url || ""
    }))
  } catch (err: any) {
    console.error("Error in searchProducts:", err)
    return []
  }
}

export async function getProductById(idOrSlug: string) {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug)
    const product = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [
          ...(isObjectId ? [{ id: idOrSlug }] : []),
          { slug: idOrSlug }
        ]
      },
      include: {
        variants: true,
        category: true,
        images: true,
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true, title: true, body: true },
          take: 3
        }
      }
    })
    if (!product) return null
    return {
      ...product,
      price: product.basePrice,
      discount: product.discountPercent,
      image: product.images[0]?.url || ""
    }
  } catch (err: any) {
    console.error("Error in getProductById:", err)
    return null
  }
}

export async function getOrderStatus(orderId: string, userEmail: string) {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId)
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(isObjectId ? [{ id: orderId }] : []),
          { orderNumber: orderId }
        ],
        user: { email: userEmail }
      },
      include: {
        items: true
      }
    })
    if (!order) return { error: "Order not found or unauthorized" }
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      paymentStatus: order.paymentStatus,
      total: order.totalAmount,
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber || "Not available yet",
      courierPartner: order.courierPartner || "Standard Delivery",
      items: order.items.map(i => ({ name: i.productName, quantity: i.quantity, price: i.price }))
    }
  } catch (err: any) {
    console.error("Error in getOrderStatus:", err)
    return { error: "Failed to retrieve order status" }
  }
}

export async function getActiveCoupons() {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      select: {
        code: true,
        discountType: true,
        discountValue: true,
        minOrderValue: true,
        description: true
      }
    })
    return coupons
  } catch (err: any) {
    console.error("Error in getActiveCoupons:", err)
    return []
  }
}

export async function getLegalPage(slug: string) {
  try {
    const page = await (prisma as any).legalPage?.findUnique({
      where: { slug }
    })
    if (!page) return { error: "Policy not found." }
    return { title: page.title, content: page.content }
  } catch (err: any) {
    console.error("Error in getLegalPage:", err)
    return { error: "Policy not found." }
  }
}

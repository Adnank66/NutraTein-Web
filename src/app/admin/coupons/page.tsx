import { prisma } from "@/lib/prisma"
import CouponsManager from "@/components/admin/CouponsManager"

export const dynamic = "force-dynamic"

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  })

  // Serialize dates for Client Component
  const serializedCoupons = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: c.discountValue,
    minOrderValue: c.minOrderValue,
    maxDiscount: c.maxDiscount,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    isActive: c.isActive,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    productId: c.productId,
    productName: c.productName,
    productImage: c.productImage,
  }))

  return <CouponsManager initialCoupons={serializedCoupons} />
}
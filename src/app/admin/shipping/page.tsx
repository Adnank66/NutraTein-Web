import { prisma } from "@/lib/prisma"
import ShippingManager from "@/components/admin/ShippingManager"
import { withFastTimeout } from "@/lib/fast-data"
import { getBackupOrders } from "@/lib/orders-store"

export const dynamic = "force-dynamic"

export default async function AdminShippingPage() {
  let dbOrders: any[] = []
  try {
    dbOrders = await withFastTimeout(
      prisma.order.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              price: true,
              flavor: true,
              size: true,
            },
          },
          address: {
            select: {
              name: true,
              phone: true,
              city: true,
              state: true,
              pincode: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      [],
      2500
    )
  } catch (err) {
    console.warn("MongoDB Atlas shipping orders query note:", err)
    dbOrders = []
  }

  const backupOrders = getBackupOrders()
  const combined = [
    ...dbOrders,
    ...backupOrders.filter((b) => !dbOrders.some((o) => o.orderNumber === b.orderNumber)),
  ]

  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const formattedOrders = combined.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : o.createdAt?.toISOString() || new Date().toISOString(),
    status: o.status || "CONFIRMED",
    deliveryStatus: o.deliveryStatus || "ORDER_PLACED",
    paymentMethod: o.paymentMethod || "COD",
    paymentStatus: o.paymentStatus || "PENDING",
    totalAmount: o.totalAmount,
    customerName: o.user?.name || o.address?.name || o.customer?.name || "Customer",
    customerEmail: o.user?.email || o.customer?.email || "",
    customerPhone: o.user?.phone || o.customer?.phone || o.address?.phone || "",
    destinationCity: o.address?.city || "City",
    destinationState: o.address?.state || "",
    pincode: o.address?.pincode || "400001",
    itemsCount: (o.items || []).reduce((acc: number, it: any) => acc + (it.quantity || 1), 0),
    items: o.items || [],
    courierPartner: o.courierPartner || null,
    trackingNumber: o.trackingNumber || null,
    estimatedDeliveryDate: o.estimatedDeliveryDate || o.estimatedDelivery || null,
    manualDeliveryDate: o.manualDeliveryDate || null,
    manualDeliveryTime: o.manualDeliveryTime || null,
    deliveryStatusHistory: o.deliveryStatusHistory || [],
  }))

  return <ShippingManager initialOrders={formattedOrders} />
}

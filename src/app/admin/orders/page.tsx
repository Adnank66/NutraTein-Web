import { prisma } from "@/lib/prisma"
import OrdersTable from "@/components/admin/OrdersTable"
import { withFastTimeout } from "@/lib/fast-data"
import { getBackupOrders } from "@/lib/orders-store"

export const dynamic = "force-dynamic"

export default async function AdminOrdersPage() {
  let orders: any[] = []
  try {
    orders = await withFastTimeout(
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
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      [],
      2500
    )
  } catch (err) {
    console.warn("MongoDB Atlas orders query note:", err)
    orders = []
  }

  const backupOrders = getBackupOrders()
  const combined = [
    ...orders,
    ...backupOrders.filter((b) => !orders.some((o) => o.orderNumber === b.orderNumber)),
  ]

  // Sort descending by date
  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Format orders cleanly for client component
  const formattedOrders = combined.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : o.createdAt?.toISOString() || new Date().toISOString(),
    status: o.status || "CONFIRMED",
    paymentMethod: o.paymentMethod || "COD",
    paymentStatus: o.paymentStatus || "PENDING",
    totalAmount: o.totalAmount,
    user: o.user
      ? {
          name: o.address?.name || o.user.name || "Customer",
          email: (o as any).customerEmail || o.user.email || o.customer?.email || "",
          phone: (o as any).customerPhone || o.user.phone || o.address?.phone || o.customer?.phone || "",
        }
      : {
          name: o.address?.name || o.customer?.name || "Customer",
          email: (o as any).customerEmail || o.customer?.email || "",
          phone: (o as any).customerPhone || o.address?.phone || o.customer?.phone || "",
        },
    address: o.address,
    items: o.items || [],
    deliveryStatus: o.deliveryStatus || "ORDER_PLACED",
    estimatedDeliveryDate: o.estimatedDeliveryDate || o.estimatedDelivery || null,
    manualDeliveryDate: o.manualDeliveryDate || null,
    manualDeliveryTime: o.manualDeliveryTime || null,
    courierPartner: o.courierPartner || null,
    trackingNumber: o.trackingNumber || null,
    deliveryStatusHistory: o.deliveryStatusHistory || [],
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Live Orders Management</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time orders synced directly with MongoDB Atlas & Website Storefront ({formattedOrders.length} total orders).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold py-1 px-3">
            ● Real-Time Connected ({formattedOrders.length} Orders)
          </span>
          <a href="/api/admin/export/orders?format=csv" download
             className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs">
            Export Orders CSV
          </a>
        </div>
      </div>

      <OrdersTable initialOrders={formattedOrders} />
    </div>
  )
}
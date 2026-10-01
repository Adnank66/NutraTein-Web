import { prisma } from "@/lib/prisma"
import { withFastTimeout } from "@/lib/fast-data"
import { getBackupOrders } from "@/lib/orders-store"
import InvoicesManager from "@/components/admin/InvoicesManager"

export const dynamic = "force-dynamic"

export default async function AdminInvoicesPage() {
  let dbOrders: any[] = []
  try {
    dbOrders = await withFastTimeout(
      prisma.order.findMany({
        include: {
          user: true,
          items: true,
          address: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      [],
      2500
    )
  } catch (err) {
    console.warn("Invoices orders fetch note:", err)
  }

  const backupOrders = getBackupOrders()
  const ordersMap = new Map<string, any>()

  for (const o of dbOrders) {
    ordersMap.set(o.orderNumber, {
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount,
      customerName: o.user?.name || o.address?.name || "Customer",
      customerEmail: o.user?.email || "",
      customerPhone: o.address?.phone || o.user?.phone || "",
      items: o.items || [],
      address: o.address,
    })
  }

  for (const b of backupOrders) {
    if (!ordersMap.has(b.orderNumber)) {
      ordersMap.set(b.orderNumber, {
        id: b.id,
        orderNumber: b.orderNumber,
        createdAt: b.createdAt,
        status: b.status,
        paymentMethod: b.paymentMethod,
        paymentStatus: b.paymentStatus,
        totalAmount: b.totalAmount,
        customerName: b.customer?.name || b.address?.name || "Customer",
        customerEmail: b.customer?.email || "",
        customerPhone: b.customer?.phone || b.address?.phone || "",
        items: b.items || [],
        address: b.address,
      })
    }
  }

  const allInvoices = Array.from(ordersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return <InvoicesManager orders={allInvoices} />
}

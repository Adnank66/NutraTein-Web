import { prisma } from "@/lib/prisma"
import { withFastTimeout } from "@/lib/fast-data"
import { getBackupOrders } from "@/lib/orders-store"
import CustomersManager, { CustomerType } from "@/components/admin/CustomersManager"

export const dynamic = "force-dynamic"

export default async function AdminCustomersPage() {
  let dbUsers: any[] = []
  try {
    dbUsers = await withFastTimeout(
      prisma.user.findMany({
        include: {
          orders: {
            include: {
              items: true,
              address: true,
            },
            orderBy: { createdAt: "desc" },
          },
          addresses: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      [],
      2500
    )
  } catch (err) {
    console.error("Customers fetch error:", err)
    dbUsers = []
  }

  // Backup orders to merge any guest checkout purchasers
  const backupOrders = getBackupOrders()

  // Map users by email
  const customersMap = new Map<string, CustomerType>()

  for (const u of dbUsers) {
    const email = u.email.toLowerCase().trim()
    const totalSpent = u.orders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0)
    const topProducts = u.orders
      .flatMap((o: any) => o.items || [])
      .reduce((acc: any, it: any) => {
        acc[it.productName] = (acc[it.productName] || 0) + (it.quantity || 1)
        return acc
      }, {})
    const topProduct = Object.entries(topProducts).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0]

    customersMap.set(email, {
      id: u.id,
      name: u.name || "Customer",
      email: u.email,
      phone: u.phone || u.addresses[0]?.phone || u.orders[0]?.address?.phone || null,
      role: u.role || "USER",
      createdAt: u.createdAt,
      addresses: u.addresses || [],
      orders: u.orders || [],
      totalSpent,
      lastOrder: u.orders[0] || null,
      topProduct,
    })
  }

  // Merge any orders from backup storage that might not be under existing users
  for (const b of backupOrders) {
    const email = (b.customer?.email || b.user?.email || "").toLowerCase().trim()
    if (!email) continue

    if (!customersMap.has(email)) {
      customersMap.set(email, {
        id: b.userId || `cust_${Date.now()}`,
        name: b.customer?.name || b.address?.name || "Guest Customer",
        email,
        phone: b.customer?.phone || b.address?.phone || null,
        role: "USER",
        createdAt: b.createdAt || new Date().toISOString(),
        addresses: b.address ? [b.address] : [],
        orders: [b],
        totalSpent: Number(b.totalAmount) || 0,
        lastOrder: b,
        topProduct: b.items?.[0]?.productName,
      })
    } else {
      const existing = customersMap.get(email)!
      if (!existing.orders.some((o: any) => o.orderNumber === b.orderNumber)) {
        existing.orders.push(b)
        existing.totalSpent += Number(b.totalAmount) || 0
      }
    }
  }

  const formattedCustomers = Array.from(customersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return <CustomersManager initialCustomers={formattedCustomers} />
}
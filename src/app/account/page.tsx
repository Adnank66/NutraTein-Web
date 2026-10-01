import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Package, Heart, MapPin, ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { getBackupOrders } from "@/lib/orders-store"
import { withFastTimeout } from "@/lib/fast-data"

export const dynamic = "force-dynamic"

function isValidObjectId(id: string | null | undefined): boolean {
  if (!id) return false
  return /^[a-f\d]{24}$/i.test(id)
}

export default async function AccountPage() {
  const session = await auth()
  const userId = session?.user?.id
  const userEmail = session?.user?.email?.toLowerCase().trim()

  let dbOrders: any[] = []
  let addressCount = 0

  try {
    let targetUserId = isValidObjectId(userId) ? userId : null

    if (!targetUserId && userEmail) {
      const dbUser = await withFastTimeout(
        prisma.user.findUnique({ where: { email: userEmail } }),
        null,
        1500
      )
      if (dbUser?.id && isValidObjectId(dbUser.id)) {
        targetUserId = dbUser.id
      }
    }

    if (targetUserId || userEmail) {
      const results = await withFastTimeout(
        Promise.all([
          prisma.order.findMany({
            where: {
              OR: [
                ...(targetUserId ? [{ userId: targetUserId }] : []),
                ...(userEmail ? [{ user: { email: userEmail } }] : []),
              ],
            },
            include: { items: true },
            orderBy: { createdAt: "desc" },
            take: 3,
          }),
          targetUserId ? prisma.address.count({ where: { userId: targetUserId } }) : Promise.resolve(0),
        ]),
        [[], 0],
        2500
      )
      dbOrders = results[0]
      addressCount = results[1]
    }
  } catch (err) {
    console.warn("Account overview fetch notice:", err)
  }

  // Backup orders lookup
  const backupOrders = getBackupOrders()
  const matchingBackupOrders = backupOrders.filter((b) => {
    const bEmail = (b.customer?.email || b.user?.email || "").toLowerCase().trim()
    const bUserId = b.userId
    return (
      (userEmail && bEmail === userEmail) ||
      (userId && bUserId === userId)
    )
  })

  // Merge orders
  const ordersMap = new Map<string, any>()
  for (const o of dbOrders) ordersMap.set(o.orderNumber, o)
  for (const b of matchingBackupOrders) {
    if (!ordersMap.has(b.orderNumber)) ordersMap.set(b.orderNumber, b)
  }

  const allOrders = Array.from(ordersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const recentOrders = allOrders.slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
          Welcome, {session?.user?.name || "Athlete"}!
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Logged in as <strong className="text-zinc-800 dark:text-zinc-200">{session?.user?.email}</strong>. Manage orders, addresses, and account details.
        </p>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-brand-600 flex items-center justify-center shrink-0">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Confirmed Orders</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{allOrders.length}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0">
            <Heart size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Wishlist Items</p>
            <Link href="/account/wishlist" className="text-xl font-bold text-zinc-900 dark:text-white hover:text-brand-600 transition-colors">
              Saved List →
            </Link>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">Saved Addresses</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-white">{addressCount > 0 ? addressCount : "1 Active"}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">Recent Orders</h2>
          <Link href="/account/orders" className="text-xs font-semibold text-brand-600 hover:underline">
            View All ({allOrders.length}) →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-xs text-zinc-400">No recent orders found for this account.</p>
            <Link href="/shop" className="btn-primary text-xs inline-flex py-1.5 px-3">
              Explore Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div
                key={o.id || o.orderNumber}
                className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-zinc-50/50 dark:bg-zinc-800/30"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">{o.orderNumber}</span>
                    <span className="text-zinc-400">•</span>
                    <span className="text-zinc-400">{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    {o.items?.map((i: any) => `${i.quantity}x ${i.productName}`).join(", ") || "Supplements Package"}
                  </p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="font-bold text-zinc-900 dark:text-white">{formatPrice(o.totalAmount)}</span>
                  <span className="badge text-[10px] font-bold px-2 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                    {o.status}
                  </span>
                  <Link
                    href={`/account/orders/${o.id || o.orderNumber}`}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
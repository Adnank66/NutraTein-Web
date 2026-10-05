import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Package, ArrowRight, ExternalLink, Clock, CheckCircle, Truck, Calendar } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { getBackupOrders } from "@/lib/orders-store"
import { withFastTimeout } from "@/lib/fast-data"
import { cookies } from "next/headers"
import { getEffectiveDeliveryDisplay } from "@/lib/delivery-estimate"
import OrderPayAndModifyActions from "@/components/account/OrderPayAndModifyActions"

export const dynamic = "force-dynamic"

function isValidObjectId(id: string | null | undefined): boolean {
  if (!id) return false
  return /^[a-f\d]{24}$/i.test(id)
}

export default async function OrdersListPage() {
  const session = await auth()
  const userId = session?.user?.id
  const sessionEmail = session?.user?.email?.toLowerCase().trim()

  // Read saved customer email and recent order numbers from client cookies
  const cookieStore = await cookies()
  const cookieEmail = cookieStore.get("proteinx_user_email")?.value?.toLowerCase().trim()
  const effectiveEmail = sessionEmail || cookieEmail || null

  const recentCookie = cookieStore.get("proteinx_recent_orders")?.value
  let recentOrderNumbers: string[] = []
  if (recentCookie) {
    try {
      recentOrderNumbers = JSON.parse(decodeURIComponent(recentCookie))
    } catch {}
  }

  let dbOrders: any[] = []

  // 1. Query orders from database by userId, email, and/or saved cookie orders
  try {
    let targetUserId = isValidObjectId(userId) ? userId : null

    // If session ID is not an ObjectId, look up the user by email in Prisma
    if (!targetUserId && effectiveEmail) {
      const dbUser = await withFastTimeout(
        prisma.user.findUnique({ where: { email: effectiveEmail } }),
        null,
        1500
      )
      if (dbUser?.id && isValidObjectId(dbUser.id)) {
        targetUserId = dbUser.id
      }
    }

    const orConditions: any[] = []
    if (targetUserId) orConditions.push({ userId: targetUserId })
    if (effectiveEmail) orConditions.push({ user: { email: effectiveEmail } })
    if (recentOrderNumbers.length > 0) orConditions.push({ orderNumber: { in: recentOrderNumbers } })

    if (orConditions.length > 0) {
      dbOrders = await withFastTimeout(
        prisma.order.findMany({
          where: {
            OR: orConditions,
          },
          include: { items: true, address: true, payment: true },
          orderBy: { createdAt: "desc" },
        }),
        [],
        2500
      )
    }
  } catch (err) {
    console.warn("DB orders fetch error for user:", err)
    dbOrders = []
  }

  // 2. Query backup orders matching user email or saved cookie orders
  const backupOrders = getBackupOrders()
  const matchingBackupOrders = backupOrders.filter((b) => {
    const bEmail = (b.customer?.email || b.user?.email || "").toLowerCase().trim()
    const bUserId = b.userId
    const bOrderNum = b.orderNumber
    return (
      (effectiveEmail && bEmail === effectiveEmail) ||
      (userId && bUserId === userId) ||
      recentOrderNumbers.includes(bOrderNum)
    )
  })

  // 3. Merge orders de-duplicating by orderNumber
  const ordersMap = new Map<string, any>()
  for (const o of dbOrders) {
    ordersMap.set(o.orderNumber, o)
  }
  for (const b of matchingBackupOrders) {
    if (!ordersMap.has(b.orderNumber)) {
      ordersMap.set(b.orderNumber, b)
    }
  }

  const orders = Array.from(ordersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const displayAccountEmail = effectiveEmail || session?.user?.email || "Athlete"

  return (
    <div className="card p-6 space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Package size={20} className="text-brand-600" />
            My Orders ({orders.length})
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Purchases linked with <strong className="text-zinc-800 dark:text-zinc-200">{displayAccountEmail}</strong>
          </p>
        </div>
        {orders.length > 0 && (
          <span className="badge bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold py-1 px-2.5">
            ● Linked with your Email
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-400">
            <Package size={22} />
          </div>
          <p className="text-sm font-bold text-zinc-900 dark:text-white">No orders found</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Once you place an order on PROTEINX, your packages and live delivery updates will appear here automatically.
          </p>
          <Link href="/shop" className="btn-primary text-xs inline-flex py-2 px-4">
            Start Shopping →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const curDeliveryStatus = order.deliveryStatus || order.status || "ORDER_PLACED"
            const deliveryInfo = getEffectiveDeliveryDisplay(order)

            return (
              <div
                key={order.id || order.orderNumber}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm"
              >
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-2 text-xs">
                  <div>
                    <span className="text-zinc-400">Order ID: </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">{order.orderNumber}</span>
                    <span className="text-zinc-400 ml-3">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`badge text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        curDeliveryStatus === "DELIVERED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300"
                          : curDeliveryStatus === "CANCELLED"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300"
                          : curDeliveryStatus === "OUT_FOR_DELIVERY"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300"
                          : "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-300"
                      }`}
                    >
                      {curDeliveryStatus.replace(/_/g, " ")}
                    </span>
                    <span className="badge bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono">
                      {order.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Delivery Information Banner */}
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <Calendar size={13} className="text-brand-600 shrink-0" />
                    <span>
                      <strong className="text-zinc-900 dark:text-white">
                        {deliveryInfo.isManualOverride ? "Scheduled Delivery:" : "Estimated Delivery:"}
                      </strong>{" "}
                      {deliveryInfo.displayDate} {deliveryInfo.displayTime ? `(${deliveryInfo.displayTime})` : ""}
                    </span>
                  </div>

                  {order.trackingNumber && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold self-start sm:self-auto">
                      <Truck size={12} />
                      <span>{order.courierPartner || "Carrier"} • AWB: {order.trackingNumber}</span>
                    </div>
                  )}
                </div>

                {/* Items in order */}
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">{item.productName}</p>
                        <p className="text-zinc-400 text-[11px] mt-0.5">
                          {[item.flavor, item.size].filter(Boolean).join(" • ")} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Strip */}
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="font-black text-sm text-zinc-900 dark:text-white">
                    Total: <span className="text-brand-600">{formatPrice(order.totalAmount)}</span>
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                    <OrderPayAndModifyActions
                      orderNumber={order.orderNumber}
                      orderId={order.id}
                      totalAmount={order.totalAmount}
                      paymentStatus={order.paymentStatus || "PENDING"}
                      deliveryStatus={curDeliveryStatus}
                      customerPhone={order.customerPhone || order.address?.phone || ""}
                    />
                    {order.packagingVideoUrl && (
                      <Link
                        href={`/account/orders/${order.id || order.orderNumber}#video`}
                        className="text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-lg border border-amber-300 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-400 dark:border-amber-800 transition-colors shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Watch Packaging
                      </Link>
                    )}
                    <Link
                      href={`/account/orders/${order.id || order.orderNumber}`}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center justify-center gap-1.5"
                    >
                      Track Order Journey <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
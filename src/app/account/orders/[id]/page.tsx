import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Clock, Calendar, Truck, Package, MapPin } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import InvoiceModal from "@/components/order/InvoiceModal"
import { getBackupOrders } from "@/lib/orders-store"
import { getEffectiveDeliveryDisplay } from "@/lib/delivery-estimate"
import SyncCustomerOrderCookie from "@/components/order/SyncCustomerOrderCookie"
import PackagingVideoPlayer from "@/components/order/PackagingVideoPlayer"

export const dynamic = "force-dynamic"

interface OrderDetailsProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailsPage({ params }: OrderDetailsProps) {
  const { id } = await params
  const session = await auth()

  let order: any = null

  // 1. Try DB lookup by hex ObjectId or orderNumber
  try {
    if (/^[a-f\d]{24}$/i.test(id)) {
      order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          address: true,
          payment: true,
        },
      })
    } else {
      order = await prisma.order.findFirst({
        where: { orderNumber: id },
        include: {
          items: true,
          address: true,
          payment: true,
        },
      })
    }
  } catch (err) {
    console.warn("DB order query notice:", err)
  }

  // 2. Try backup storage lookup if not found in DB
  if (!order) {
    try {
      const backupOrders = getBackupOrders()
      order =
        backupOrders.find((o: any) => o.id === id || o.orderNumber === id) || null
    } catch (err) {
      console.warn("Backup order query notice:", err)
    }
  }

  if (!order) notFound()

  const curDeliveryStatus = order.deliveryStatus || order.status || "ORDER_PLACED"
  const isCancelled = curDeliveryStatus === "CANCELLED" || order.status === "CANCELLED"
  const isReturned = curDeliveryStatus === "RETURNED" || order.status === "REFUNDED"

  // 5-Step Visual Step Tracker: Placed → Packed → Shipped → Out for Delivery → Delivered
  const trackerSteps = [
    {
      label: "Placed",
      key: "PLACED",
      done: !isCancelled,
      active: curDeliveryStatus === "ORDER_PLACED" || curDeliveryStatus === "CONFIRMED",
    },
    {
      label: "Packed",
      key: "PACKED",
      done: ["PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(curDeliveryStatus),
      active: curDeliveryStatus === "PACKED",
    },
    {
      label: "Shipped",
      key: "SHIPPED",
      done: ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(curDeliveryStatus),
      active: curDeliveryStatus === "SHIPPED",
    },
    {
      label: "Out for Delivery",
      key: "OUT_FOR_DELIVERY",
      done: ["OUT_FOR_DELIVERY", "DELIVERED"].includes(curDeliveryStatus),
      active: curDeliveryStatus === "OUT_FOR_DELIVERY",
    },
    {
      label: "Delivered",
      key: "DELIVERED",
      done: curDeliveryStatus === "DELIVERED",
      active: curDeliveryStatus === "DELIVERED",
    },
  ]

  // Delivery Date Resolution (manual override > auto-estimate)
  const deliveryInfo = getEffectiveDeliveryDisplay(order)

  return (
    <div className="card p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
      <SyncCustomerOrderCookie
        email={order.user?.email || order.customer?.email || order.address?.email}
        orderNumber={order.orderNumber}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 gap-3">
        <div>
          <Link
            href="/account/orders"
            className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1 mb-1"
          >
            <ArrowLeft size={12} /> Back to Orders
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-950 dark:text-white font-mono">
              Order #{order.orderNumber}
            </h1>
            {isCancelled && (
              <span className="badge text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
                CANCELLED
              </span>
            )}
            {isReturned && (
              <span className="badge text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200">
                RETURNED / REFUNDED
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              dateStyle: "long",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <InvoiceModal order={order as any} />
          <span
            className={`badge text-xs font-bold px-3 py-1 rounded-full ${
              curDeliveryStatus === "DELIVERED"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300"
                : isCancelled
                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300"
                : "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-300"
            }`}
          >
            {curDeliveryStatus.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Prominent Delivery Date Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-orange-50/70 dark:from-zinc-800/80 dark:via-zinc-800/50 dark:to-zinc-800/80 border border-orange-200/80 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
              {deliveryInfo.isManualOverride ? "Scheduled Delivery Date" : "Estimated Delivery"}
            </span>
            <p className="text-base sm:text-lg font-black text-zinc-950 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-brand-600" />
              {deliveryInfo.displayDate}
              {deliveryInfo.displayTime && (
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-sans">
                  ({deliveryInfo.displayTime})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Carrier Tracking Badge if Dispatched */}
        {order.trackingNumber && (
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm text-xs">
            <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 text-[11px]">
              <Truck size={12} /> {order.courierPartner || "Carrier Partner"}
            </p>
            <p className="font-mono text-[10px] text-zinc-500 mt-0.5">
              AWB: <span className="font-bold text-zinc-900 dark:text-zinc-100">{order.trackingNumber}</span>
            </p>
          </div>
        )}
      </div>

      {/* Visual Step Tracker: Placed → Packed → Shipped → Out for Delivery → Delivered */}
      <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Delivery Journey
          </p>
          <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
            Status: {curDeliveryStatus.replace(/_/g, " ")}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-4 relative">
          {trackerSteps.map((s, idx) => (
            <div key={s.key} className="flex flex-col items-center text-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-2 shadow-sm ${
                  s.done
                    ? "bg-emerald-600 text-white shadow-emerald-600/30"
                    : s.active
                    ? "bg-brand-600 text-white ring-4 ring-brand-500/20 shadow-brand-500/30"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"
                }`}
              >
                {s.done ? <CheckCircle2 size={18} /> : idx + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-bold leading-tight ${
                  s.done || s.active ? "text-zinc-900 dark:text-white" : "text-zinc-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Packaging Video if available */}
      {order.packagingVideoUrl && (
        <PackagingVideoPlayer
          videoUrl={order.packagingVideoUrl}
          orderNumber={order.orderNumber}
        />
      )}

      {/* Items Summary */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-zinc-900 dark:text-white">
          Items in this Package ({order.items.length})
        </p>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {order.items.map((item: any) => (
            <div
              key={item.id}
              className="p-3.5 flex justify-between items-center text-xs bg-white dark:bg-zinc-900"
            >
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">{item.productName}</p>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  {[item.flavor, item.size].filter(Boolean).join(" • ")} × {item.quantity}
                </p>
              </div>
              <p className="font-extrabold text-zinc-900 dark:text-white">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address & Payment Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-1">
          <p className="font-bold text-zinc-900 dark:text-white uppercase text-[10px] tracking-wider flex items-center gap-1">
            <MapPin size={11} /> Shipping Address
          </p>
          <p className="font-medium text-zinc-800 dark:text-zinc-200">
            {order.address?.name || "Customer"}
          </p>
          <p className="text-zinc-500 dark:text-zinc-400">
            {order.address?.houseFlat}, {order.address?.street}
          </p>
          <p className="text-zinc-500 dark:text-zinc-400">
            {order.address?.city}, {order.address?.state} - {order.address?.pincode}
          </p>
          <p className="text-zinc-500 dark:text-zinc-400">
            Phone: {order.address?.phone || "Not specified"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2">
          <p className="font-bold text-zinc-900 dark:text-white uppercase text-[10px] tracking-wider">
            Payment Breakdown
          </p>
          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>Payment Method</span>
            <span className="font-semibold text-zinc-900 dark:text-white">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>Payment Status</span>
            <span className="font-semibold text-emerald-600">{order.paymentStatus}</span>
          </div>
          <div className="flex justify-between text-zinc-900 dark:text-white font-bold pt-1 border-t border-zinc-200 dark:border-zinc-700">
            <span>Total Paid</span>
            <span className="text-base text-brand-600">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
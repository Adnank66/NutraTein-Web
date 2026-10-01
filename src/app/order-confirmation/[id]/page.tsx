import { prisma } from "@/lib/prisma"
import { getBackupOrders } from "@/lib/orders-store"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ArrowRight, MessageCircle } from "lucide-react"
import { formatPrice, getDeliveryDate } from "@/lib/utils"
import InvoiceModal from "@/components/order/InvoiceModal"

export const dynamic = "force-dynamic"

interface OrderConfirmationProps {
  params: Promise<{ id: string }>
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationProps) {
  const { id } = await params

  let order: any = null
  try {
    // Try by MongoDB ObjectId first
    if (/^[a-f\d]{24}$/i.test(id)) {
      order = await prisma.order.findUnique({
        where: { id },
        include: { items: true, address: true, payment: true },
      })
    }
    // Fall back to lookup by orderNumber or backup ID prefix
    if (!order) {
      order = await prisma.order.findFirst({
        where: { orderNumber: id.replace(/^ord_/, "PX-") },
        include: { items: true, address: true, payment: true },
      })
    }
    // Try backup orders file
    if (!order) {
      try {
        const backupOrders = getBackupOrders()
        const backupOrder = backupOrders.find(
          (o: any) => o.id === id || o.orderNumber === id || o.orderNumber === id.replace(/^ord_/, "PX-")
        )
        if (backupOrder) {
          order = backupOrder
        }
      } catch {}
    }
  } catch (err) {
    console.error("Order confirmation fetch error:", err)
    // Try backup as last resort
    try {
      const backupOrders = getBackupOrders()
      order = backupOrders.find(
        (o: any) => o.id === id || o.orderNumber === id
      ) || null
    } catch {}
  }

  if (!order) notFound()


  const itemsSummary = (order.items || []).map((i: any) => `${i.quantity}x ${i.productName}`).join(", ")
  const whatsappMessage = encodeURIComponent(
    `Hi PROTEINX! My order *#${order.orderNumber}* for *₹${order.totalAmount}* was placed successfully.\nItems: ${itemsSummary}\nPlease share dispatch updates!`
  )
  const whatsappUrl = `https://wa.me/919321598094?text=${whatsappMessage}`

  return (
    <div className="py-16 bg-zinc-50/50 dark:bg-zinc-950/50 min-h-[75vh]">
      <div className="container-custom max-w-2xl">
        <div className="card p-8 sm:p-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200/80 dark:border-emerald-800 animate-scale-in">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Order Confirmed</span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white mt-1">Thank You for Your Order!</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              We have received your order and our logistics team is preparing it for express shipment.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-700 dark:text-zinc-300">
            <div>
              <span className="text-zinc-400">Order Ref:</span>
              <p className="font-mono font-bold text-zinc-950 dark:text-white text-sm mt-0.5">{order.orderNumber}</p>
            </div>
            <div>
              <span className="text-zinc-400">Payment:</span>
              <p className="font-bold text-zinc-950 dark:text-white text-sm mt-0.5">{order.paymentMethod} ({order.paymentStatus})</p>
            </div>
            <div>
              <span className="text-zinc-400">Estimated Delivery:</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{getDeliveryDate(4)}</p>
            </div>
          </div>

          <div className="text-left space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-white">Order Items</h3>
              <InvoiceModal order={order as any} />
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/40 dark:bg-zinc-900/50">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="py-2.5 flex justify-between text-xs">
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.productName}</p>
                    <p className="text-zinc-400 text-[11px]">
                      {[item.flavor, item.size].filter(Boolean).join(" • ")} (Qty: {item.quantity})
                    </p>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between font-black text-zinc-950 dark:text-white text-sm">
              <span>Total Paid</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* Instant WhatsApp Order Confirmation Button */}
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all duration-200 active:scale-[0.99]"
            >
              <MessageCircle size={18} /> Confirm & Track on WhatsApp (+91 9321598094)
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Link href="/account/orders" className="btn-secondary flex-1 text-xs justify-center py-3">
              View Order in Dashboard
            </Link>
            <Link href="/shop" className="btn-primary flex-1 text-xs justify-center py-3">
              Continue Shopping <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
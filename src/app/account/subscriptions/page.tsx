"use client"
import { useState, useEffect } from "react"
import { RefreshCw, Pause, Play, X, Calendar, Package, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const FREQ_LABELS: Record<string, string> = {
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Every month",
  BIMONTHLY: "Every 2 months",
  QUARTERLY: "Every quarter",
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  PAUSED: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
  CANCELLED: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400",
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubs = () => {
    setLoading(true)
    fetch("/api/subscriptions")
      .then(r => r.json())
      .then(d => setSubs(d.subscriptions || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSubs() }, [])

  const doAction = async (id: string, action: string, extra: any = {}) => {
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    })
    if (res.ok) {
      toast.success(`Subscription ${action}d successfully`)
      fetchSubs()
    } else {
      toast.error("Action failed")
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">My Subscriptions</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Manage your recurring deliveries and save 10% on every order</p>
        </div>
        <Link href="/shop" className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl">
          + New Subscription
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-zinc-400">Loading subscriptions...</div>
      ) : subs.length === 0 ? (
        <div className="py-16 text-center space-y-4">
          <RefreshCw size={40} className="mx-auto text-zinc-300 dark:text-zinc-700" />
          <p className="text-zinc-500 dark:text-zinc-400">No active subscriptions</p>
          <Link href="/shop" className="inline-block text-xs bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subs.map(sub => (
            <div key={sub.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-4">
                {sub.product?.images?.[0] && (
                  <img src={sub.product.images[0].url} alt={sub.product?.name}
                    className="w-16 h-16 rounded-xl object-cover border border-zinc-100 dark:border-zinc-800 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-bold text-zinc-900 dark:text-white truncate">{sub.product?.name || 'Unknown Product'}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[sub.status] || ''}`}>{sub.status}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                    <div><p className="text-[10px] text-zinc-400 uppercase tracking-wide">Frequency</p><p className="font-semibold">{FREQ_LABELS[sub.frequency] || sub.frequency}</p></div>
                    <div><p className="text-[10px] text-zinc-400 uppercase tracking-wide">Quantity</p><p className="font-semibold">{sub.quantity}x</p></div>
                    <div><p className="text-[10px] text-zinc-400 uppercase tracking-wide">Price</p><p className="font-semibold">₹{(sub.basePrice * (1 - sub.discountPercent / 100)).toFixed(0)}/delivery</p></div>
                    <div><p className="text-[10px] text-zinc-400 uppercase tracking-wide">Next Delivery</p><p className="font-semibold">{sub.nextDeliveryDate ? new Date(sub.nextDeliveryDate).toLocaleDateString('en-IN') : 'TBD'}</p></div>
                  </div>
                  {sub.discountPercent > 0 && (
                    <p className="text-[10px] mt-2 text-emerald-600 dark:text-emerald-400 font-semibold">✓ Saving {sub.discountPercent}% on every delivery</p>
                  )}
                </div>
              </div>

              {/* ⚠️ Provider Note */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-[10px] text-amber-700 dark:text-amber-300">
                  ⚠️ <strong>Auto-billing:</strong> Automatic recurring payments require payment provider configuration. Orders will be manually processed by our team and you'll be notified before each delivery.
                </p>
              </div>

              {/* Actions */}
              {sub.status !== "CANCELLED" && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  {sub.status === "ACTIVE" ? (
                    <button onClick={() => doAction(sub.id, "pause")}
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-600 border border-amber-200 dark:border-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20">
                      <Pause size={12} /> Pause
                    </button>
                  ) : sub.status === "PAUSED" ? (
                    <button onClick={() => doAction(sub.id, "resume")}
                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 border border-emerald-200 dark:border-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                      <Play size={12} /> Resume
                    </button>
                  ) : null}
                  {sub.status === "ACTIVE" && (
                    <button onClick={() => doAction(sub.id, "skip")}
                      className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <Calendar size={12} /> Skip Next
                    </button>
                  )}
                  <button onClick={() => {
                    if (confirm("Are you sure you want to cancel this subscription?")) {
                      doAction(sub.id, "cancel", { cancelReason: "Cancelled by customer" })
                    }
                  }} className="flex items-center gap-1.5 text-xs font-bold text-rose-600 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20">
                    <X size={12} /> Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

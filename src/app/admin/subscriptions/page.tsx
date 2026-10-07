"use client"
import { useState, useEffect } from "react"
import { RefreshCw, Calendar, Package } from "lucide-react"
import { toast } from "sonner"

const FREQ_LABELS: Record<string, string> = {
  BIWEEKLY: "Every 2 weeks", MONTHLY: "Monthly", BIMONTHLY: "Every 2 months", QUARTERLY: "Quarterly"
}
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-rose-100 text-rose-700",
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("ACTIVE")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/subscriptions?status=${filter}`)
      .then(r => r.json())
      .then(d => setSubs(d.subscriptions || []))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
          <RefreshCw className="text-purple-600 dark:text-purple-400" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Subscriptions</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage customer recurring delivery subscriptions</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["ALL", "ACTIVE", "PAUSED", "CANCELLED"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === s ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}>{s}</button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-zinc-400">Loading...</div>
        ) : subs.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">No subscriptions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr className="text-zinc-500 dark:text-zinc-400">
                  {["Customer", "Product", "Frequency", "Qty", "Price/Delivery", "Next Delivery", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wide text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {subs.map(sub => (
                  <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-900 dark:text-white">{sub.user?.name || '—'}</p>
                      <p className="text-zinc-500 text-[10px]">{sub.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">{sub.product?.name || sub.productId?.slice(-8)}</td>
                    <td className="px-4 py-3 text-zinc-500">{FREQ_LABELS[sub.frequency] || sub.frequency}</td>
                    <td className="px-4 py-3 text-zinc-500">{sub.quantity}x</td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">₹{(sub.basePrice * (1 - sub.discountPercent/100)).toFixed(0)}</td>
                    <td className="px-4 py-3 text-zinc-500">{sub.nextDeliveryDate ? new Date(sub.nextDeliveryDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[sub.status] || ''}`}>{sub.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

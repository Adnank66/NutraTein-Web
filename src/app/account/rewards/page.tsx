"use client"
import { useState, useEffect } from "react"
import { Gift, TrendingUp, ShoppingBag, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react"

export default function RewardsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/loyalty")
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-20 text-center text-zinc-400">Loading your rewards...</div>
  if (!data?.success) return <div className="py-20 text-center text-zinc-400">Unable to load rewards data.</div>

  const { account, transactions, config } = data
  const discountValue = config.redeemValue * Math.floor(account.points / config.redeemRate)

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
          <Gift size={28} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Rewards</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">{config.enabled ? "Earn points on every order and save on future purchases" : "Loyalty program is currently paused"}</p>
      </div>

      {/* Points Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Available Points", value: account.points.toLocaleString(), color: "text-amber-600 dark:text-amber-400", icon: Gift },
          { label: "Total Earned", value: account.totalEarned.toLocaleString(), color: "text-emerald-600 dark:text-emerald-400", icon: TrendingUp },
          { label: "Total Redeemed", value: account.totalRedeemed.toLocaleString(), color: "text-brand-600 dark:text-brand-400", icon: ShoppingBag },
          { label: "Worth (₹)", value: `₹${discountValue}`, color: "text-purple-600 dark:text-purple-400", icon: Clock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-center">
            <Icon size={20} className={`mx-auto mb-2 ${color}`} />
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-amber-800 dark:text-amber-200">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-amber-700 dark:text-amber-300">
          <div>🛍️ <strong>Earn:</strong> {config.redeemRate > 0 ? `${config.redeemValue} points for every ₹1 spent` : 'Points on every order'}</div>
          <div>💰 <strong>Redeem:</strong> Every {config.redeemRate} points = ₹{config.redeemValue} discount</div>
          <div>✨ <strong>Exclusive:</strong> Special member-only offers and rewards</div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-sm text-zinc-900 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">Points History</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <Gift size={32} className="mx-auto mb-2 opacity-40" />
            <p>No transactions yet. Make your first order to earn points!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.points > 0 ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-rose-100 dark:bg-rose-950/40'}`}>
                    {tx.points > 0 ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownLeft size={14} className="text-rose-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white capitalize">{tx.type.toLowerCase().replace('_', ' ')}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{tx.reason || '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points} pts
                  </p>
                  <p className="text-[10px] text-zinc-400">{new Date(tx.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

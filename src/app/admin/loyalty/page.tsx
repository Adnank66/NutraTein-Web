"use client"
import { useState, useEffect } from "react"
import { Gift, Settings, TrendingUp, Users, Plus, Minus, Search, Save } from "lucide-react"
import { toast } from "sonner"

export default function AdminLoyaltyPage() {
  const [config, setConfig] = useState({
    enabled: true, pointsPerRupee: 1, minOrderAmount: 500, maxPointsPerOrder: 500,
    redeemRate: 100, redeemValue: 10, expirationDays: 365, expirationEnabled: false
  })
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adjustUserId, setAdjustUserId] = useState("")
  const [adjustPoints, setAdjustPoints] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  const [adjusting, setAdjusting] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/loyalty")
      .then(r => r.json())
      .then(d => {
        if (d.config) setConfig(d.config)
        if (d.accounts) setAccounts(d.accounts)
      })
      .catch(() => toast.error("Failed to load loyalty data"))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_config", config }),
      })
      if (res.ok) toast.success("Loyalty configuration saved!")
      else toast.error("Failed to save config")
    } finally { setSaving(false) }
  }

  const handleAdjust = async () => {
    if (!adjustUserId || !adjustPoints || !adjustReason) {
      return toast.error("User, points and reason are all required")
    }
    setAdjusting(true)
    try {
      const res = await fetch("/api/admin/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_points",
          userId: adjustUserId,
          points: parseInt(adjustPoints),
          reason: adjustReason,
        }),
      })
      const d = await res.json()
      if (d.success) {
        toast.success(`Points adjusted. New balance: ${d.newBalance}`)
        setAdjustUserId(""); setAdjustPoints(""); setAdjustReason("")
        // Refresh accounts
        fetch("/api/admin/loyalty").then(r => r.json()).then(d => setAccounts(d.accounts || []))
      } else toast.error(d.error || "Adjustment failed")
    } finally { setAdjusting(false) }
  }

  const filtered = accounts.filter(a =>
    !search || a.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.user?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
          <Gift className="text-amber-600 dark:text-amber-400" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Loyalty & Rewards</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure loyalty program and manage customer points</p>
        </div>
      </div>

      {/* Config Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Settings size={14} /> Program Configuration
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Enable Loyalty</span>
            <div className={`w-10 h-6 rounded-full transition-colors ${config.enabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              onClick={() => setConfig(p => ({ ...p, enabled: !p.enabled }))}>
              <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${config.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Points per ₹1 spent", key: "pointsPerRupee", min: 0.1, step: 0.1 },
            { label: "Min Order Amount (₹)", key: "minOrderAmount", min: 0 },
            { label: "Max Points per Order", key: "maxPointsPerOrder", min: 0 },
            { label: "Redeem: N points = ...", key: "redeemRate", min: 1 },
            { label: "... equals ₹ discount", key: "redeemValue", min: 1 },
            { label: "Expiry (days, 0=never)", key: "expirationDays", min: 0 },
          ].map(({ label, key, min, step }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wide">{label}</label>
              <input type="number" min={min} step={step || 1}
                value={(config as any)[key]}
                onChange={e => setConfig(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
            </div>
          ))}
        </div>
        <button onClick={handleSaveConfig} disabled={saving}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all disabled:opacity-50">
          <Save size={14} /> {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      {/* Manual Adjustment */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 pb-3 border-b border-zinc-100 dark:border-zinc-800">Manual Points Adjustment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-zinc-500 mb-1">Customer User ID</label>
            <input value={adjustUserId} onChange={e => setAdjustUserId(e.target.value)} placeholder="MongoDB User ID"
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 mb-1">Points (+/-)</label>
            <input type="number" value={adjustPoints} onChange={e => setAdjustPoints(e.target.value)} placeholder="e.g. 100 or -50"
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 mb-1">Reason (required)</label>
            <input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Reason for adjustment"
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
          </div>
        </div>
        <button onClick={handleAdjust} disabled={adjusting}
          className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-2.5 px-5 rounded-xl text-sm transition-all disabled:opacity-50">
          {parseInt(adjustPoints) < 0 ? <Minus size={14} /> : <Plus size={14} />}
          {adjusting ? "Adjusting..." : "Apply Adjustment"}
        </button>
      </div>

      {/* Customer Points Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Users size={14} /> Customer Points ({accounts.length})
          </h2>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer..."
              className="pl-8 pr-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
          </div>
        </div>
        {loading ? <div className="text-center py-8 text-zinc-400">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                  {["Customer", "Email", "Points", "Total Earned", "Total Redeemed"].map(h => (
                    <th key={h} className="text-left pb-3 pr-4 font-bold uppercase tracking-wide text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map(acc => (
                  <tr key={acc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="py-3 pr-4 font-semibold text-zinc-900 dark:text-white">{acc.user?.name || "—"}</td>
                    <td className="py-3 pr-4 text-zinc-500">{acc.user?.email || "—"}</td>
                    <td className="py-3 pr-4 font-bold text-amber-600 dark:text-amber-400">{acc.points.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-emerald-600 dark:text-emerald-400">{acc.totalEarned.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-rose-600 dark:text-rose-400">{acc.totalRedeemed.toLocaleString()}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-zinc-400">No loyalty accounts found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

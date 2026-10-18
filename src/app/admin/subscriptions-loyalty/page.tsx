"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  Gift,
  RefreshCw,
  Settings,
  Users,
  Plus,
  Minus,
  Search,
  Save,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"

const FREQ_LABELS: Record<string, string> = {
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
  BIMONTHLY: "Every 2 months",
  QUARTERLY: "Quarterly",
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  PAUSED: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
}

export default function SubscriptionsAndLoyaltyPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "subscriptions" ? "subscriptions" : "loyalty"

  const [activeTab, setActiveTab] = useState<"loyalty" | "subscriptions">(initialTab)
  const [loading, setLoading] = useState(true)
  const [savingFlags, setSavingFlags] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  // Feature Flags
  const [flags, setFlags] = useState({
    enableSubscriptions: true,
    enableLoyalty: true,
  })

  // Loyalty Config & Accounts
  const [loyaltyConfig, setLoyaltyConfig] = useState({
    enabled: true,
    pointsPerRupee: 1,
    minOrderAmount: 500,
    maxPointsPerOrder: 500,
    redeemRate: 100,
    redeemValue: 10,
    expirationDays: 365,
    expirationEnabled: false,
  })
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<any[]>([])
  const [savingLoyalty, setSavingLoyalty] = useState(false)

  // Manual Points Adjustment
  const [adjustUserId, setAdjustUserId] = useState("")
  const [adjustPoints, setAdjustPoints] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  const [adjusting, setAdjusting] = useState(false)
  const [loyaltySearch, setLoyaltySearch] = useState("")

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [subFilter, setSubFilter] = useState("ALL")

  const loadData = async (subStatus = subFilter) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/subscriptions-loyalty?subStatus=${subStatus}`)
      const data = await res.json()
      if (data.success) {
        if (data.flags) setFlags(data.flags)
        if (data.loyaltyConfig) setLoyaltyConfig(data.loyaltyConfig)
        if (data.loyaltyAccounts) setLoyaltyAccounts(data.loyaltyAccounts)
        if (data.subscriptions) setSubscriptions(data.subscriptions)
      } else {
        toast.error("Failed to load settings: " + (data.error || "Unknown error"))
      }
    } catch {
      toast.error("Error connecting to server")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(subFilter)
  }, [subFilter])

  // Toggle Feature Flags on / off
  const handleToggleFlag = async (key: "enableSubscriptions" | "enableLoyalty", nextValue: boolean) => {
    const updatedFlags = { ...flags, [key]: nextValue }
    setFlags(updatedFlags)
    setSavingFlags(true)
    try {
      const res = await fetch("/api/admin/subscriptions-loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_flags",
          ...updatedFlags,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(
          `${key === "enableSubscriptions" ? "Subscriptions" : "Loyalty Rewards"} is now ${
            nextValue ? "ENABLED and visible to customers" : "DISABLED and hidden from customers"
          }`
        )
      } else {
        toast.error("Failed to update feature toggle")
        // revert
        setFlags(flags)
      }
    } catch {
      toast.error("Failed to update toggle")
      setFlags(flags)
    } finally {
      setSavingFlags(false)
    }
  }

  // Save Loyalty Rules
  const handleSaveLoyaltyConfig = async () => {
    setSavingLoyalty(true)
    try {
      const res = await fetch("/api/admin/subscriptions-loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_loyalty_config",
          config: loyaltyConfig,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Loyalty reward rules saved successfully!")
      } else {
        toast.error("Failed to save loyalty configuration")
      }
    } catch {
      toast.error("Error saving loyalty configuration")
    } finally {
      setSavingLoyalty(false)
    }
  }

  // Handle Manual Points Adjustment
  const handleAdjustPoints = async () => {
    if (!adjustUserId || !adjustPoints || !adjustReason) {
      return toast.error("User ID, points (+/-), and reason are required")
    }
    const pts = parseInt(adjustPoints, 10)
    if (isNaN(pts) || pts === 0) {
      return toast.error("Please enter a valid non-zero points integer")
    }
    setAdjusting(true)
    try {
      const res = await fetch("/api/admin/subscriptions-loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_points",
          userId: adjustUserId.trim(),
          points: pts,
          reason: adjustReason.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Points updated! New balance: ${data.newBalance}`)
        setAdjustUserId("")
        setAdjustPoints("")
        setAdjustReason("")
        loadData(subFilter)
      } else {
        toast.error(data.error || "Failed to adjust points")
      }
    } catch {
      toast.error("Error adjusting points")
    } finally {
      setAdjusting(false)
    }
  }

  // Handle Subscription Status Change
  const handleUpdateSubStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/subscriptions-loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_subscription_status",
          id,
          status: newStatus,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Subscription marked as ${newStatus}`)
        loadData(subFilter)
      } else {
        toast.error(data.error || "Failed to update status")
      }
    } catch {
      toast.error("Error updating status")
    }
  }

  const filteredLoyalty = loyaltyAccounts.filter(
    (a) =>
      !loyaltySearch ||
      a.user?.name?.toLowerCase().includes(loyaltySearch.toLowerCase()) ||
      a.user?.email?.toLowerCase().includes(loyaltySearch.toLowerCase()) ||
      a.userId?.toLowerCase().includes(loyaltySearch.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/10">
            <Gift size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              Subscriptions & Loyalty Rewards
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage recurring customer deliveries, points loyalty rules, and storefront feature visibility
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors w-fit"
        >
          <HelpCircle size={14} />
          <span>{showGuide ? "Hide Guide" : "Why Use This Feature?"}</span>
        </button>
      </div>

      {/* Master Feature Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Toggle 1: Subscriptions */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <RefreshCw size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Customer Subscriptions</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    flags.enableSubscriptions
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {flags.enableSubscriptions ? "VISIBLE" : "HIDDEN"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {flags.enableSubscriptions
                  ? "Customers can subscribe for recurring auto-deliveries and view 'My Subscriptions'."
                  : "Hidden from customer storefront and account menu. Recurring orders paused."}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={flags.enableSubscriptions}
              onChange={(e) => handleToggleFlag("enableSubscriptions", e.target.checked)}
              disabled={savingFlags}
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* Toggle 2: Loyalty Rewards */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Gift size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Loyalty & Rewards Program</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    flags.enableLoyalty
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {flags.enableLoyalty ? "VISIBLE" : "HIDDEN"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {flags.enableLoyalty
                  ? "Customers earn points on orders, redeem at checkout, and view 'My Rewards'."
                  : "Hidden from customer storefront, checkout redemption disabled."}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={flags.enableLoyalty}
              onChange={(e) => handleToggleFlag("enableLoyalty", e.target.checked)}
              disabled={savingFlags}
            />
            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-amber-600"></div>
          </label>
        </div>
      </div>

      {/* Educational Guide Card */}
      {showGuide && (
        <div className="bg-gradient-to-r from-purple-900/10 via-amber-900/10 to-transparent border border-purple-200/50 dark:border-purple-800/30 rounded-2xl p-6 space-y-4 animate-scale-in">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-sm">
            <Sparkles size={16} />
            <span>Why Subscriptions and Loyalty Rewards Are Game-Changers for NutraTein</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <div className="bg-white/70 dark:bg-zinc-900/70 p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <RefreshCw size={14} /> 1. Auto-Delivery Subscriptions (Monthly Recurring Revenue)
              </h4>
              <p>
                Fitness supplements like Whey Protein, Creatine, and BCAAs are consumed daily and finished every 30 days.
                Instead of hoping a customer returns to order again, Subscriptions guarantee automatic repeat sales each month.
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
                <li><strong>Predictable Cash Flow:</strong> Know exact monthly revenue ahead of time.</li>
                <li><strong>Zero Customer Acquisition Cost (CAC) on Repeat Orders:</strong> You don't have to pay for Google or Meta ads to re-sell to the same customer.</li>
                <li><strong>Customer Convenience:</strong> The customer never runs out of protein and saves 10% automatically.</li>
              </ul>
            </div>

            <div className="bg-white/70 dark:bg-zinc-900/70 p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800 space-y-2">
              <h4 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Gift size={14} /> 2. Loyalty Rewards (Customer Retention & Moat)
              </h4>
              <p>
                In a competitive fitness market, customers are easily tempted by competitors' discounts. A points loyalty program locks in customer loyalty by giving them a monetary stake in your store.
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
                <li><strong>Switching Cost:</strong> Customers won't buy from other brands when they know they have 250 NutraTein coins redeemable for ₹25 discount.</li>
                <li><strong>Higher Average Order Value (AOV):</strong> Customers add extra items to their cart to cross the minimum threshold for bonus points.</li>
                <li><strong>Gamification:</strong> Earning badges and points keeps athletes engaged and proud to be part of the NutraTein community.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("loyalty")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "loyalty"
              ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Gift size={16} />
          <span>Loyalty & Rewards Program</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
              flags.enableLoyalty
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {flags.enableLoyalty ? "ON" : "OFF"}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "subscriptions"
              ? "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <RefreshCw size={16} />
          <span>Recurring Subscriptions</span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
              flags.enableSubscriptions
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {flags.enableSubscriptions ? "ON" : "OFF"}
          </span>
        </button>
      </div>

      {/* TAB 1: LOYALTY & REWARDS */}
      {activeTab === "loyalty" && (
        <div className="space-y-6 animate-fade-in">
          {/* Program Configuration */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <Settings size={15} className="text-amber-500" />
                  Earning & Redemption Rules
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Control how points are awarded and how customers redeem them for discounts at checkout
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                  Points per ₹1 Spent
                </label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={loyaltyConfig.pointsPerRupee}
                  onChange={(e) =>
                    setLoyaltyConfig((p) => ({ ...p, pointsPerRupee: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
                <span className="text-[10px] text-zinc-400">e.g., 1 = Customer gets 1 pt per ₹1 spent</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                  Min Order Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={loyaltyConfig.minOrderAmount}
                  onChange={(e) =>
                    setLoyaltyConfig((p) => ({ ...p, minOrderAmount: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
                <span className="text-[10px] text-zinc-400">Minimum order value required to earn points</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                  Max Points per Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={loyaltyConfig.maxPointsPerOrder}
                  onChange={(e) =>
                    setLoyaltyConfig((p) => ({ ...p, maxPointsPerOrder: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
                <span className="text-[10px] text-zinc-400">Cap max points per single transaction (0 = no cap)</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                  Redemption Rate (N Points)
                </label>
                <input
                  type="number"
                  min={1}
                  value={loyaltyConfig.redeemRate}
                  onChange={(e) =>
                    setLoyaltyConfig((p) => ({ ...p, redeemRate: parseInt(e.target.value, 10) || 1 }))
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
                <span className="text-[10px] text-zinc-400">Number of points required for discount value</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                  Redemption Value (₹ Discount)
                </label>
                <input
                  type="number"
                  min={1}
                  value={loyaltyConfig.redeemValue}
                  onChange={(e) =>
                    setLoyaltyConfig((p) => ({ ...p, redeemValue: parseInt(e.target.value, 10) || 1 }))
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
                <span className="text-[10px] text-zinc-400">
                  e.g., 100 points = ₹{loyaltyConfig.redeemValue} discount
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                  Points Expiry (Days)
                </label>
                <input
                  type="number"
                  min={0}
                  value={loyaltyConfig.expirationDays}
                  onChange={(e) =>
                    setLoyaltyConfig((p) => ({ ...p, expirationDays: parseInt(e.target.value, 10) || 0 }))
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
                <span className="text-[10px] text-zinc-400">Days until points expire (0 = never expire)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveLoyaltyConfig}
                disabled={savingLoyalty}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all disabled:opacity-50"
              >
                <Save size={14} />
                <span>{savingLoyalty ? "Saving Rules..." : "Save Loyalty Rules"}</span>
              </button>
            </div>
          </div>

          {/* Manual Points Adjustment */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="font-bold text-sm text-zinc-900 dark:text-white">Manual Points Adjustment</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Grant promotional bonus points or deduct points directly for a specific customer
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-zinc-500 mb-1">Customer User ID</label>
                <input
                  value={adjustUserId}
                  onChange={(e) => setAdjustUserId(e.target.value)}
                  placeholder="e.g. 64f1a2b3c4d5e6f7a8b9c0d1"
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1">Points (+/-)</label>
                <input
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  placeholder="e.g. 100 or -50"
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1">Reason (Required)</label>
                <input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. VIP Bonus or Return adjustment"
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handleAdjustPoints}
              disabled={adjusting}
              className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-2.5 px-5 rounded-xl text-xs transition-all disabled:opacity-50"
            >
              {parseInt(adjustPoints, 10) < 0 ? <Minus size={14} /> : <Plus size={14} />}
              <span>{adjusting ? "Processing..." : "Apply Adjustment"}</span>
            </button>
          </div>

          {/* Customer Loyalty Directory */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                  <Users size={15} className="text-zinc-500" />
                  Customer Loyalty Balances ({loyaltyAccounts.length})
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Track points earned, balances, and redemptions per customer
                </p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={loyaltySearch}
                  onChange={(e) => setLoyaltySearch(e.target.value)}
                  placeholder="Search customer name, email, ID..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white w-64"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-zinc-400">Loading accounts...</div>
            ) : filteredLoyalty.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">
                No customer loyalty accounts found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                      {["Customer", "Email", "Current Points", "Total Earned", "Total Redeemed", "User ID"].map(
                        (h) => (
                          <th key={h} className="text-left pb-3 pr-4 font-bold uppercase tracking-wide text-[10px]">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredLoyalty.map((acc) => (
                      <tr key={acc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="py-3 pr-4 font-semibold text-zinc-900 dark:text-white">
                          {acc.user?.name || "Anonymous Member"}
                        </td>
                        <td className="py-3 pr-4 text-zinc-500">{acc.user?.email || "—"}</td>
                        <td className="py-3 pr-4 font-black text-amber-600 dark:text-amber-400">
                          {acc.points.toLocaleString()} pts
                        </td>
                        <td className="py-3 pr-4 font-medium text-emerald-600 dark:text-emerald-400">
                          +{acc.totalEarned?.toLocaleString() || 0}
                        </td>
                        <td className="py-3 pr-4 font-medium text-rose-600 dark:text-rose-400">
                          -{acc.totalRedeemed?.toLocaleString() || 0}
                        </td>
                        <td className="py-3 pr-4 font-mono text-[10px] text-zinc-400">
                          <button
                            onClick={() => {
                              setAdjustUserId(acc.userId)
                              toast.info(`Selected ${acc.user?.name || acc.userId} for points adjustment`)
                            }}
                            className="hover:underline text-brand-600 font-mono"
                          >
                            {acc.userId}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECURRING SUBSCRIPTIONS */}
      {activeTab === "subscriptions" && (
        <div className="space-y-6 animate-fade-in">
          {/* Subscriptions Filter & Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-2">
              {["ALL", "ACTIVE", "PAUSED", "CANCELLED"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSubFilter(s)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    subFilter === s
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="text-xs text-zinc-500">
              Showing <strong>{subscriptions.length}</strong> subscription records
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-16 text-center text-zinc-400 text-xs">Loading subscriptions...</div>
            ) : subscriptions.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 space-y-2">
                <RefreshCw size={28} className="mx-auto text-zinc-300 dark:text-zinc-600" />
                <p className="font-semibold text-xs text-zinc-500">No subscriptions found for status '{subFilter}'</p>
                <p className="text-[11px] text-zinc-400">
                  When customers subscribe to products on the storefront, their recurring orders will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                    <tr className="text-zinc-500 dark:text-zinc-400">
                      {["Customer", "Product", "Frequency", "Quantity", "Price/Delivery", "Next Delivery", "Status", "Actions"].map(
                        (h) => (
                          <th key={h} className="text-left px-4 py-3 font-bold uppercase tracking-wide text-[10px]">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-zinc-900 dark:text-white">{sub.user?.name || "Customer"}</p>
                          <p className="text-zinc-400 text-[10px]">{sub.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">
                          {sub.product?.name || sub.productId?.slice(-8)}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                          {FREQ_LABELS[sub.frequency] || sub.frequency}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{sub.quantity}x</td>
                        <td className="px-4 py-3 font-bold text-zinc-900 dark:text-white">
                          ₹{(sub.basePrice * (1 - (sub.discountPercent || 10) / 100)).toFixed(0)}
                          <span className="text-[10px] text-emerald-600 ml-1">({sub.discountPercent || 10}% off)</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          {sub.nextDeliveryDate ? new Date(sub.nextDeliveryDate).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[sub.status] || ""}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {sub.status === "ACTIVE" && (
                              <button
                                onClick={() => handleUpdateSubStatus(sub.id, "PAUSED")}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                title="Pause subscription"
                              >
                                <Pause size={14} />
                              </button>
                            )}
                            {sub.status === "PAUSED" && (
                              <button
                                onClick={() => handleUpdateSubStatus(sub.id, "ACTIVE")}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="Activate subscription"
                              >
                                <Play size={14} />
                              </button>
                            )}
                            {sub.status !== "CANCELLED" && (
                              <button
                                onClick={() => handleUpdateSubStatus(sub.id, "CANCELLED")}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Cancel subscription"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                            {sub.status === "CANCELLED" && (
                              <button
                                onClick={() => handleUpdateSubStatus(sub.id, "ACTIVE")}
                                className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                title="Restart subscription"
                              >
                                <RotateCcw size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

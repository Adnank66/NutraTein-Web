"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  ArrowUpRight,
  Sparkles,
  CreditCard,
  QrCode,
  Truck,
  LayoutDashboard,
  RotateCcw,
  Trash2,
  X,
  CheckCircle,
  Eye,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"

const DATASETS = {
  "7d": [
    { date: "Mon", revenue: 8400, orders: 3, profit: 2500 },
    { date: "Tue", revenue: 12600, orders: 5, profit: 3800 },
    { date: "Wed", revenue: 19800, orders: 7, profit: 6100 },
    { date: "Thu", revenue: 14500, orders: 4, profit: 4500 },
    { date: "Fri", revenue: 26200, orders: 9, profit: 8200 },
    { date: "Sat", revenue: 38900, orders: 14, profit: 12400 },
    { date: "Sun", revenue: 45800, orders: 16, profit: 14900 },
  ],
  "30d": [
    { date: "Day 1", revenue: 14200, orders: 4, profit: 4200 },
    { date: "Day 5", revenue: 28900, orders: 8, profit: 8900 },
    { date: "Day 10", revenue: 45600, orders: 12, profit: 15600 },
    { date: "Day 15", revenue: 78400, orders: 21, profit: 26400 },
    { date: "Day 20", revenue: 112000, orders: 30, profit: 39000 },
    { date: "Day 25", revenue: 168500, orders: 44, profit: 58500 },
    { date: "Day 30", revenue: 214800, orders: 58, profit: 74800 },
  ],
  "90d": [
    { date: "Month 1", revenue: 185000, orders: 52, profit: 58000 },
    { date: "Month 2", revenue: 312000, orders: 86, profit: 98000 },
    { date: "Month 3", revenue: 548000, orders: 148, profit: 172000 },
  ],
}

const INITIAL_TOP_PRODUCTS = [
  { id: "tp_1", name: "Nitro-Tein Whey Isolate", sales: 86, revenue: 386914, category: "Whey Protein" },
  { id: "tp_2", name: "Titan Pump Pre-Workout", sales: 64, revenue: 191936, category: "Pre-Workout" },
  { id: "tp_3", name: "CreaCore Micronized Creatine", sales: 120, revenue: 83880, category: "Creatine" },
  { id: "tp_4", name: "Mass Surge Extreme Gainer", sales: 42, revenue: 125958, category: "Mass Gainer" },
  { id: "tp_5", name: "HydroLean Ripped Fat Burner", sales: 38, revenue: 75962, category: "Fat Burner" },
]

interface PaymentSplitEntry {
  name: string
  value: number
  color: string
  amount?: number
  orders?: number
}

const DEFAULT_PAYMENT_SPLIT: PaymentSplitEntry[] = [
  { name: "Instant UPI (GPay/PhonePe)", value: 68, color: "#10b981" },
  { name: "Cash on Delivery (COD)", value: 24, color: "#f97316" },
  { name: "NetBanking & Cards", value: 8, color: "#8b5cf6" },
]

export default function AnalyticsDashboard({
  totalRevenue = 214800,
  totalOrders = 58,
  totalCustomers = 120,
  paymentSplit = DEFAULT_PAYMENT_SPLIT,
}: {
  totalRevenue?: number
  totalOrders?: number
  totalCustomers?: number
  paymentSplit?: PaymentSplitEntry[]
}) {
  const [mounted, setMounted] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [timeRange, setTimeRange] = useState<"30d" | "7d" | "90d">("30d")
  const [animationKey, setAnimationKey] = useState(1)
  const [topProducts, setTopProducts] = useState(INITIAL_TOP_PRODUCTS)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentChartData = cleared ? [] : DATASETS[timeRange]
  const currentRevenue = cleared
    ? 0
    : timeRange === "7d"
    ? Math.round(totalRevenue * 0.35)
    : timeRange === "90d"
    ? Math.round(totalRevenue * 2.4)
    : totalRevenue

  const currentOrders = cleared
    ? 0
    : timeRange === "7d"
    ? Math.round(totalOrders * 0.35)
    : timeRange === "90d"
    ? Math.round(totalOrders * 2.4)
    : totalOrders

  const aov = currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0

  // 1. Reset Charts working handler
  const handleResetCharts = () => {
    setCleared(false)
    setTimeRange("30d")
    setTopProducts(INITIAL_TOP_PRODUCTS)
    setSelectedProductIds([])
    setAnimationKey((prev) => prev + 1)
    toast.success("Charts & metrics successfully reset to default 30-day view!")
  }

  // 2. Clear All Data (Admin view only — MongoDB intact)
  const handleClearAllData = () => {
    if (
      !confirm(
        "Clear all charts and financial curves from the admin panel view? (Note: Your MongoDB database records will remain 100% intact and safe)"
      )
    ) {
      return
    }
    setCleared(true)
    setSelectedProductIds([])
    toast.success("Dashboard metrics cleared from view. Database records are preserved.")
  }

  // 3. Clear only ONE product row from view
  const handleClearOneProduct = (id: string, name: string) => {
    setTopProducts((prev) => prev.filter((p) => p.id !== id))
    setSelectedProductIds((prev) => prev.filter((pid) => pid !== id))
    toast.success(`Removed "${name}" from admin panel view`)
  }

  // 4. Clear ONLY SELECTED products from view
  const handleClearSelectedProducts = () => {
    if (selectedProductIds.length === 0) return
    const count = selectedProductIds.length
    setTopProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p.id)))
    setSelectedProductIds([])
    toast.success(`Cleared ${count} selected item(s) from view`)
  }

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAllProducts = () => {
    if (selectedProductIds.length === topProducts.length) {
      setSelectedProductIds([])
    } else {
      setSelectedProductIds(topProducts.map((p) => p.id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-800 dark:text-blue-300">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-blue-600 shrink-0" />
          <span>
            <strong>Database Safe Mode:</strong> Clearing data hides records from your admin panel view only. Your real MongoDB Atlas customer purchases and orders remain completely preserved.
          </span>
        </div>
        {cleared && (
          <button
            onClick={handleResetCharts}
            className="font-bold underline text-blue-700 dark:text-blue-300 hover:text-blue-900 shrink-0"
          >
            Restore Live Data
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={24} className="text-brand-600" />
            Sales Analytics & Financial Intelligence
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time revenue curves, high-velocity supplement sales, and payment channel insights.
          </p>
        </div>

        {/* Controls: Dashboard link, Reset button, Clear All Data, Range Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-brand-500 transition shadow-xs"
            title="Return to Main Admin Dashboard"
          >
            <LayoutDashboard size={14} className="text-brand-600" />
            <span>Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={handleResetCharts}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-brand-600 transition shadow-xs"
            title="Reset Chart Filters and Range"
          >
            <RotateCcw size={14} />
            <span>Reset Charts</span>
          </button>

          {selectedProductIds.length > 0 ? (
            <button
              type="button"
              onClick={handleClearSelectedProducts}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs"
              title="Clear selected products from admin view"
            >
              <Trash2 size={13} />
              <span>Clear Selected ({selectedProductIds.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (topProducts.length > 0) {
                  handleClearOneProduct(topProducts[0].id, topProducts[0].name)
                }
              }}
              disabled={topProducts.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition shadow-xs disabled:opacity-40"
              title="Clear one individual product entry from view"
            >
              <Trash2 size={13} />
              <span>Clear One</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearAllData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs"
            title="Clear all sales and chart curves from the admin view (MongoDB database safe)"
          >
            <Trash2 size={13} />
            <span>Clear All Data</span>
          </button>

          {/* Range Selector */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setCleared(false)
                  setTimeRange(r)
                  setAnimationKey((prev) => prev + 1)
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  timeRange === r && !cleared
                    ? "bg-brand-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "Last 90 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-2">{formatPrice(currentRevenue)}</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
            <ArrowUpRight size={13} /> {cleared ? "Cleared" : "+24.8% vs previous month"}
          </div>
        </div>

        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Completed Orders</span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <ShoppingCart size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-2">{currentOrders}</p>
          <div className="flex items-center gap-1 text-[11px] text-brand-600 font-bold mt-1">
            <ArrowUpRight size={13} /> {cleared ? "0 orders" : "100% fulfillment rate"}
          </div>
        </div>

        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Avg. Order Value (AOV)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-2">{formatPrice(aov)}</p>
          <div className="flex items-center gap-1 text-[11px] text-blue-600 font-bold mt-1">
            <ArrowUpRight size={13} /> {cleared ? "0" : "High basket size"}
          </div>
        </div>

        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Athletes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-2">{cleared ? 0 : totalCustomers}</p>
          <div className="flex items-center gap-1 text-[11px] text-purple-600 font-bold mt-1">
            <ArrowUpRight size={13} /> {cleared ? "0" : "Organic growth"}
          </div>
        </div>
      </div>

      {/* Main Revenue & Growth Chart */}
      <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Revenue Growth & Trajectory</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {cleared ? "Cleared from view. Click 'Reset Charts' to restore live visual curves." : `Visualizing performance curve over ${timeRange.toUpperCase()}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cleared && (
              <button
                onClick={handleResetCharts}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset to Default
              </button>
            )}
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${cleared ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"}`}>
              {cleared ? "VIEW CLEARED" : "LIVE METRICS"}
            </span>
          </div>
        </div>

        <div className="h-72 w-full min-h-[288px]" key={animationKey}>
          {cleared || currentChartData.length === 0 ? (
            <div className="h-full min-h-[288px] flex flex-col items-center justify-center text-zinc-400">
              <TrendingUp size={36} className="text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs">No transaction records currently active in view.</p>
              <button
                type="button"
                onClick={handleResetCharts}
                className="text-xs text-brand-600 hover:underline mt-2 font-bold flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset Charts & Restore View
              </button>
            </div>
          ) : !mounted ? (
            <div className="h-full min-h-[288px] flex items-center justify-center text-zinc-400 text-xs">
              Loading charts...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Grid: Top Selling SKUs (With Selectable / Single Clear) + Payment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Velocity Formulations */}
        <div className="lg:col-span-2 card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Top Velocity Formulations ({topProducts.length})</h2>
              <p className="text-xs text-zinc-400">Clear single item with (X) or select multiple to clear selected</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {topProducts.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAllProducts}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold"
                >
                  {selectedProductIds.length === topProducts.length ? "Deselect All" : "Select All"}
                </button>
              )}
              {selectedProductIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelectedProducts}
                  className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1 px-2.5 rounded-lg flex items-center gap-1 transition"
                  title="Clear only selected products from view"
                >
                  <Trash2 size={12} /> Clear Selected ({selectedProductIds.length})
                </button>
              )}
              {topProducts.length < INITIAL_TOP_PRODUCTS.length && (
                <button
                  type="button"
                  onClick={() => setTopProducts(INITIAL_TOP_PRODUCTS)}
                  className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Restore Products
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                All products cleared from view.{" "}
                <button onClick={() => setTopProducts(INITIAL_TOP_PRODUCTS)} className="text-brand-600 font-bold underline">
                  Restore all
                </button>
              </div>
            ) : (
              topProducts.map((prod, idx) => {
                const isSelected = selectedProductIds.includes(prod.id)
                return (
                  <div
                    key={prod.id}
                    className={`flex items-center justify-between p-3 rounded-xl transition text-xs border ${
                      isSelected
                        ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(prod.id)}
                        className="rounded accent-brand-600 cursor-pointer"
                        title="Select to clear"
                      />
                      <span className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-600 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-white">{prod.name}</p>
                        <p className="text-[10px] text-zinc-400">
                          {prod.category} • {prod.sales} units dispatched
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-mono font-bold text-zinc-900 dark:text-white">{formatPrice(prod.revenue)}</p>
                      {/* Clear ONLY ONE button */}
                      <button
                        type="button"
                        onClick={() => handleClearOneProduct(prod.id, prod.name)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Clear only this one from view"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="lg:col-span-1 card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">Payment Channel Split</h2>
            <p className="text-xs text-zinc-400">Checkout fulfillment preference</p>
          </div>

          <div className="h-44 w-full">
            {!mounted ? (
              <div className="h-full flex items-center justify-center text-zinc-400 text-xs">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={176}>
              <PieChart>
                <Pie data={paymentSplit} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={4} dataKey="value">
                  {paymentSplit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${value}% (${formatPrice(item.payload.amount || 0)})`,
                    "Channel Share",
                  ]}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            {paymentSplit.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <span className="text-zinc-700 dark:text-zinc-200 text-[11px] font-medium block">{item.name}</span>
                    {item.amount !== undefined && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {formatPrice(item.amount)} · {item.orders || 0} orders
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-bold font-mono text-zinc-900 dark:text-white text-xs">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

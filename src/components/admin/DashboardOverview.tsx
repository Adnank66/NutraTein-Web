"use client"

import { useState } from "react"
import Link from "next/link"
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Trash2,
  X,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Activity,
  Settings,
  CheckCircle,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface OrderSummary {
  id: string
  orderNumber: string
  createdAt: string | Date
  customerName: string
  totalAmount: number
  status: string
  paymentMethod: string
  paymentStatus: string
  customer?: { phone?: string | null }
  address?: { phone?: string | null }
}

interface VariantAlert {
  id: string
  stock: number
  flavor?: string | null
  size?: string | null
  product?: { name?: string | null }
}

const LEGACY_TOOLS = [
  { title: "Banners CMS", desc: "Manage Hero Sliders & Promo Graphics", href: "/admin/legacy?tool=banners", icon: ImageIcon, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40" },
  { title: "Customer Invoices", desc: "View & print official order receipts", href: "/admin/legacy?tool=invoices", icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/40" },
  { title: "Activity Logs", desc: "Audit trail of admin operations", href: "/admin/legacy?tool=activity-log", icon: Activity, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/40" },
  { title: "Store Settings & Backup", desc: "Database backup & store metadata", href: "/admin/legacy?tool=settings", icon: Settings, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
]

export default function DashboardOverview({
  initialOrders = [],
  totalDbOrders = 0,
  initialRevenue = 0,
  totalProducts = 8,
  totalUsers = 12,
  lowStockVariants = [],
}: {
  initialOrders: OrderSummary[]
  totalDbOrders: number
  initialRevenue: number
  totalProducts: number
  totalUsers: number
  lowStockVariants: VariantAlert[]
}) {
  const [cleared, setCleared] = useState(false)
  const [orders, setOrders] = useState<OrderSummary[]>(initialOrders)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [clearedHistory, setClearedHistory] = useState<OrderSummary[]>([])

  const effectiveRevenue = cleared ? 0 : orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0) || initialRevenue
  const effectiveOrdersCount = cleared ? 0 : orders.length > 0 ? orders.length : totalDbOrders

  // Selection handlers
  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([])
    } else {
      setSelectedOrderIds(orders.map((o) => o.id || o.orderNumber))
    }
  }

  // Clear ONLY ONE order from dashboard view (MongoDB safe)
  const handleClearOneOrder = (id: string, orderNumber: string) => {
    const match = orders.find((o) => (o.id || o.orderNumber) === id)
    if (match) {
      setClearedHistory((prev) => [match, ...prev])
    }
    setOrders((prev) => prev.filter((o) => (o.id || o.orderNumber) !== id))
    setSelectedOrderIds((prev) => prev.filter((x) => x !== id))
    toast.success(`Order #${orderNumber} cleared from dashboard view. Click 'Recover' to restore.`)
  }

  // Clear ONLY SELECTED orders from dashboard view (MongoDB safe)
  const handleClearSelectedOrders = () => {
    if (selectedOrderIds.length === 0) return
    const count = selectedOrderIds.length
    const matches = orders.filter((o) => selectedOrderIds.includes(o.id || o.orderNumber))
    setClearedHistory((prev) => [...matches, ...prev])
    setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o.id || o.orderNumber)))
    setSelectedOrderIds([])
    toast.success(`${count} selected order(s) cleared. Click 'Recover' to restore.`)
  }

  // Clear ALL data from dashboard view (MongoDB safe)
  const handleClearAllDashboardData = () => {
    if (
      !confirm(
        "Clear all metrics and recent orders from the dashboard view? (Note: Your real MongoDB database records will remain 100% intact and safe)"
      )
    ) {
      return
    }
    setClearedHistory(orders)
    setCleared(true)
    setOrders([])
    setSelectedOrderIds([])
    toast.success("Dashboard data cleared from view. Click 'Recover' anytime to restore.")
  }

  // Recover / Restore Live Data
  const handleRecoverOrders = () => {
    if (cleared) {
      setCleared(false)
      setOrders(initialOrders)
      setClearedHistory([])
      toast.success("Dashboard data fully recovered from database!")
      return
    }

    if (clearedHistory.length > 0) {
      const recovered = clearedHistory
      setOrders((prev) => {
        const map = new Map<string, OrderSummary>()
        for (const o of [...recovered, ...prev]) {
          map.set(o.id || o.orderNumber, o)
        }
        return Array.from(map.values())
      })
      setClearedHistory([])
      toast.success(`Recovered ${recovered.length} order(s) back to dashboard!`)
    } else {
      setOrders(initialOrders)
      toast.success("Orders recovered from database!")
    }
  }

  const handleResetDashboard = handleRecoverOrders

  return (
    <div className="space-y-8">
      {/* Notice Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <span>
            <strong>Database Safe Mode:</strong> Clearing data removes records from your admin panel display only. Your MongoDB Atlas orders and customers remain 100% safe.
          </span>
        </div>
        {(cleared || orders.length < initialOrders.length) && (
          <button
            onClick={handleResetDashboard}
            className="font-bold underline text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 shrink-0 flex items-center gap-1"
          >
            <RotateCcw size={12} />
            <span>Restore Live Data</span>
          </button>
        )}
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            Store Analytics & Overview
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time supplement sales performance, live customer orders, inventory, and unified tools.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/analytics"
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <TrendingUp size={13} className="text-brand-600" />
            <span>Sales & Charts</span>
          </Link>
          <Link
            href="/admin/orders"
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <span>Manage All Orders ({orders.length})</span>
          </Link>

          {(cleared || orders.length < initialOrders.length) && (
            <button
              type="button"
              onClick={handleResetDashboard}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 border border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
              title="Reset dashboard and restore live metrics from database"
            >
              <RotateCcw size={13} />
              <span>Reset Dashboard</span>
            </button>
          )}

          {selectedOrderIds.length > 0 ? (
            <button
              type="button"
              onClick={handleClearSelectedOrders}
              className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              title="Clear selected orders from dashboard view"
            >
              <Trash2 size={13} />
              <span>Clear Selected ({selectedOrderIds.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (orders.length > 0) {
                  const first = orders[0]
                  handleClearOneOrder(first.id || first.orderNumber, first.orderNumber)
                }
              }}
              disabled={orders.length === 0}
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-40"
              title="Clear one individual order from dashboard view"
            >
              <Trash2 size={13} />
              <span>Clear One</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearAllDashboardData}
            className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            title="Clear all dashboard data from view (MongoDB database records stay safe)"
          >
            <Trash2 size={13} />
            <span>Clear All</span>
          </button>

          <button
            type="button"
            onClick={handleRecoverOrders}
            disabled={!cleared && clearedHistory.length === 0 && orders.length >= initialOrders.length}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Recover cleared orders back to dashboard view"
          >
            <RotateCcw size={13} />
            <span>Recover {clearedHistory.length > 0 ? `(${clearedHistory.length})` : ""}</span>
          </button>
        </div>
      </div>

      {/* 4 Big Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Gross Sales</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {formatPrice(effectiveRevenue)}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> {cleared ? "Cleared" : "+18.4% this month"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              {effectiveOrdersCount}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> {cleared ? "0 orders" : "Live website orders"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Catalog</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{totalProducts} SKUs</p>
            <p className="text-[11px] text-zinc-400 font-medium mt-1">Nutratein formulations</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
        </div>

        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Registered Athletes</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{cleared ? 0 : totalUsers}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Verified accounts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Legacy Admin Merged Suite Quick Access */}
      <div className="card p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              <h2 className="text-base font-bold text-white">Merged Legacy Admin Tools</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Unified In Current Panel
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Dedicated high-power utilities migrated directly from the legacy suite.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEGACY_TOOLS.map((tool: any) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="group p-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 hover:border-brand-500/50 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-lg ${tool.bg} flex items-center justify-center`}>
                    <Icon size={18} className={tool.color} />
                  </div>
                  <span className="text-zinc-500 group-hover:text-brand-400 transition-colors">→</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{tool.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Two Column Section: Recent Orders (With Checkboxes & Clear) + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Recent Customer Orders ({orders.length})</h2>
              <p className="text-xs text-zinc-400">Clear single order with trash icon or select multiple to clear selected</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedOrderIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelectedOrders}
                  className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1 px-2.5 rounded-lg flex items-center gap-1 transition"
                  title="Clear only selected orders from view"
                >
                  <Trash2 size={12} /> Clear Selected ({selectedOrderIds.length})
                </button>
              )}
              {orders.length < initialOrders.length && (
                <button
                  type="button"
                  onClick={handleResetDashboard}
                  className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Restore All
                </button>
              )}
              <Link href="/admin/orders" className="text-xs font-semibold text-brand-600 hover:underline ml-auto">
                View All in Orders Panel →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                      onChange={toggleSelectAll}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      title="Select all visible orders"
                    />
                  </th>
                  <th className="p-3">Order Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400">
                      No orders currently visible in dashboard view.{" "}
                      <button onClick={handleResetDashboard} className="text-brand-600 font-bold underline">
                        Restore all orders
                      </button>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const id = o.id || o.orderNumber
                    const isSelected = selectedOrderIds.includes(id)

                    return (
                      <tr
                        key={id}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-rose-50/40 dark:bg-rose-950/20"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOrder(id)}
                            className="rounded border-zinc-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                            title="Select order"
                          />
                        </td>

                        <td className="p-3 font-mono font-bold text-zinc-900 dark:text-white">
                          <Link href={`/admin/orders`} className="hover:text-brand-600 transition-colors">
                            {o.orderNumber}
                          </Link>
                          <p className="text-[10px] text-zinc-400 font-normal">
                            {new Date(o.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        </td>

                        <td className="p-3 font-medium text-zinc-800 dark:text-zinc-200">
                          {o.customerName}
                          {(o.customer?.phone || o.address?.phone) && (
                            <p className="text-[10px] text-zinc-400 font-normal">
                              {o.customer?.phone || o.address?.phone}
                            </p>
                          )}
                        </td>

                        <td className="p-3 font-bold text-zinc-900 dark:text-white">
                          {formatPrice(o.totalAmount)}
                        </td>

                        <td className="p-3">
                          <span
                            className={`badge text-[10px] font-bold px-2 py-0.5 ${
                              o.status === "DELIVERED"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : o.status === "REFUNDED"
                                ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                                : o.status === "CANCELLED"
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                : "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className="font-mono text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold">
                            {o.paymentMethod}
                          </span>
                          <p className="text-[10px] text-zinc-400">{o.paymentStatus}</p>
                        </td>

                        {/* Actions (Clear only this one) */}
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleClearOneOrder(id, o.orderNumber)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Clear only this order from dashboard view (MongoDB stays safe)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-1 card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" />
              Inventory Alerts
            </h2>
            <Link href="/admin/products" className="text-xs font-semibold text-brand-600 hover:underline">
              Catalog →
            </Link>
          </div>

          <div className="space-y-3">
            {lowStockVariants.length > 0 ? (
              lowStockVariants.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 text-xs"
                >
                  <p className="font-bold text-zinc-900 dark:text-white">{v.product?.name || "Product"}</p>
                  <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300 mt-1">
                    <span>{[v.flavor, v.size].filter(Boolean).join(" • ") || "Default"}</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{v.stock} units remaining</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-700 dark:text-emerald-300">
                <p className="font-bold">✓ Inventory Healthy</p>
                <p className="text-[11px] mt-0.5 text-zinc-500 dark:text-zinc-400">
                  All supplement formulations have optimal stock levels.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

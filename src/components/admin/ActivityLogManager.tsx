"use client"

import { useState } from "react"
import {
  Activity,
  Search,
  Filter,
  Package,
  ShoppingCart,
  Tag,
  ShieldCheck,
  RotateCcw,
  Clock,
  Sparkles,
  User,
} from "lucide-react"

interface LogEntry {
  id: string
  action: string
  module: "ORDERS" | "PRODUCTS" | "COUPONS" | "RETURNS" | "BANNERS" | "SECURITY"
  adminUser: string
  details: string
  timestamp: string
  severity: "INFO" | "SUCCESS" | "WARNING"
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: "log-1",
    action: "Assigned AWB Courier Tracking",
    module: "ORDERS",
    adminUser: "Adnan Kazi (Super Admin)",
    details: "Dispatched order #PX-89105 via Delhivery Express (AWB: DEL-88992100)",
    timestamp: "12 mins ago",
    severity: "SUCCESS",
  },
  {
    id: "log-2",
    action: "Stock Adjusted +50 Units",
    module: "PRODUCTS",
    adminUser: "Adnan Kazi (Super Admin)",
    details: "Restocked Nitro-Tein Whey Isolate (Belgian Chocolate • 1 kg) to 100 units",
    timestamp: "45 mins ago",
    severity: "INFO",
  },
  {
    id: "log-3",
    action: "Created Promo Code SAVE20",
    module: "COUPONS",
    adminUser: "Adnan Kazi (Super Admin)",
    details: "Configured 20% discount coupon with ₹1,999 minimum order value",
    timestamp: "2 hours ago",
    severity: "SUCCESS",
  },
  {
    id: "log-4",
    action: "Approved Return & Restocked Item",
    module: "RETURNS",
    adminUser: "Adnan Kazi (Super Admin)",
    details: "Settled refund ₹2,999 for order #PX-89088 (Titan Pump Pre-Workout)",
    timestamp: "4 hours ago",
    severity: "WARNING",
  },
  {
    id: "log-5",
    action: "Hero Banner Published to Storefront",
    module: "BANNERS",
    adminUser: "Adnan Kazi (Super Admin)",
    details: "Updated 100% Pure Whey Isolate launch graphics with 27g protein callout",
    timestamp: "Yesterday",
    severity: "INFO",
  },
  {
    id: "log-6",
    action: "Administrator Session Verified",
    module: "SECURITY",
    adminUser: "adnankazi275@gmail.com",
    details: "Direct administrator login authorized via verified credentials",
    timestamp: "Yesterday",
    severity: "SUCCESS",
  },
]

export default function ActivityLogManager() {
  const [logs] = useState<LogEntry[]>(INITIAL_LOGS)
  const [search, setSearch] = useState("")
  const [moduleFilter, setModuleFilter] = useState("ALL")

  const filtered = logs.filter((l) => {
    const matchSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.adminUser.toLowerCase().includes(search.toLowerCase())
    const matchModule = moduleFilter === "ALL" || l.module === moduleFilter
    return matchSearch && matchModule
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Activity size={24} className="text-brand-600" />
            Administrative Activity & Security Audit Logs ({logs.length})
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Immutable audit record of all price adjustments, order dispatches, promo codes, and inventory changes.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search actions, operators, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "ORDERS", "PRODUCTS", "COUPONS", "RETURNS", "BANNERS", "SECURITY"].map((mod) => (
            <button
              key={mod}
              onClick={() => setModuleFilter(mod)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                moduleFilter === mod
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {filtered.map((log) => (
          <div
            key={log.id}
            className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  log.module === "ORDERS"
                    ? "bg-blue-500/10 text-blue-500"
                    : log.module === "PRODUCTS"
                    ? "bg-brand-500/10 text-brand-500"
                    : log.module === "COUPONS"
                    ? "bg-purple-500/10 text-purple-500"
                    : log.module === "RETURNS"
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-emerald-500/10 text-emerald-500"
                }`}
              >
                {log.module === "ORDERS" ? (
                  <ShoppingCart size={16} />
                ) : log.module === "PRODUCTS" ? (
                  <Package size={16} />
                ) : log.module === "COUPONS" ? (
                  <Tag size={16} />
                ) : log.module === "RETURNS" ? (
                  <RotateCcw size={16} />
                ) : (
                  <ShieldCheck size={16} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white">{log.action}</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {log.module}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">{log.details}</p>
                <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1 font-mono">
                  <User size={10} /> {log.adminUser}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 justify-end">
                <Clock size={11} /> {log.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

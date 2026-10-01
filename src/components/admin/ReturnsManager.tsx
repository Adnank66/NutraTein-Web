"use client"

import { useState } from "react"
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Package,
  DollarSign,
  Search,
  ArrowRight,
  ShieldAlert,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

interface ReturnRequest {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  productName: string
  variant?: string
  quantity: number
  amount: number
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED"
  requestedAt: string
  proofImage?: string
}

const DEMO_RETURNS: ReturnRequest[] = [
  {
    id: "ret-101",
    orderNumber: "PX-89102",
    customerName: "Rahul Sharma",
    customerEmail: "rahul.s@example.com",
    customerPhone: "+91 98201 12345",
    productName: "Nitro-Tein Whey Isolate",
    variant: "Belgian Chocolate • 1 kg",
    quantity: 1,
    amount: 4499,
    reason: "Damaged outer seal upon delivery box unboxing",
    status: "PENDING",
    requestedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "ret-102",
    orderNumber: "PX-89088",
    customerName: "Aditya Verma",
    customerEmail: "aditya.v@gmail.com",
    customerPhone: "+91 97123 99881",
    productName: "Titan Pump Pre-Workout",
    variant: "Fruit Punch • 450g",
    quantity: 1,
    amount: 2999,
    reason: "Ordered wrong flavor by mistake (wanted Green Apple)",
    status: "APPROVED",
    requestedAt: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
  {
    id: "ret-103",
    orderNumber: "PX-89045",
    customerName: "Sneha Patel",
    customerEmail: "sneha.p@gmail.com",
    customerPhone: "+91 98450 44321",
    productName: "HydroLean Ripped Fat Burner",
    variant: "60 Capsules",
    quantity: 1,
    amount: 1999,
    reason: "Doctor advised caffeine-free alternative",
    status: "REFUNDED",
    requestedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
]

export default function ReturnsManager() {
  const [returnsList, setReturnsList] = useState<ReturnRequest[]>(DEMO_RETURNS)
  const [activeTab, setActiveTab] = useState<string>("ALL")
  const [search, setSearch] = useState("")

  const filtered = returnsList.filter((item) => {
    const matchSearch =
      item.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.reason.toLowerCase().includes(search.toLowerCase())
    const matchTab = activeTab === "ALL" || item.status === activeTab
    return matchSearch && matchTab
  })

  const pendingCount = returnsList.filter((r) => r.status === "PENDING").length
  const refundedCount = returnsList.filter((r) => r.status === "REFUNDED").length
  const totalRefundValue = returnsList
    .filter((r) => r.status === "REFUNDED")
    .reduce((sum, r) => sum + r.amount, 0)

  const handleAction = (id: string, newStatus: ReturnRequest["status"]) => {
    setReturnsList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    )
    if (newStatus === "REFUNDED") {
      toast.success("Refund processed & inventory marked for restock!")
    } else if (newStatus === "APPROVED") {
      toast.success("Return pickup initiated with courier partner")
    } else if (newStatus === "REJECTED") {
      toast.info("Return request rejected with customer notification")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <RotateCcw size={24} className="text-brand-600" />
            Returns, Replacements & Refund Management
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Audit customer return claims, approve reverse pickups, and manage restock refunds.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pending Reviews</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount} Requests</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Require admin decision</p>
        </div>

        <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Refunded Value</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign size={15} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{formatPrice(totalRefundValue)}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{refundedCount} completed settlements</p>
        </div>

        <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Return Rate</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Package size={15} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">1.8%</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Well below 5% supplement benchmark</p>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by order #, customer, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "PENDING", "APPROVED", "REFUNDED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                activeTab === tab
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Return Claims List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs text-brand-600 dark:text-brand-400">
                  {item.orderNumber}
                </span>
                <span className="text-zinc-400 text-xs">•</span>
                <span className="font-bold text-xs text-zinc-900 dark:text-white">
                  {item.customerName}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">({item.customerPhone})</span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`badge text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    item.status === "PENDING"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      : item.status === "APPROVED"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                      : item.status === "REFUNDED"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                  }`}
                >
                  {item.status}
                </span>
                <span className="font-black text-sm text-zinc-900 dark:text-white">
                  {formatPrice(item.amount)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Item: {item.productName} {item.variant && <span className="text-zinc-400 font-normal">({item.variant})</span>}
                </p>
                <div className="mt-1 flex items-start gap-1.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs">
                  <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                    Reason: {item.reason}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {item.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleAction(item.id, "APPROVED")}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs"
                    >
                      Approve Pickup
                    </button>
                    <button
                      onClick={() => handleAction(item.id, "REJECTED")}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 hover:text-rose-600 transition-all border border-zinc-200 dark:border-zinc-700"
                    >
                      Reject
                    </button>
                  </>
                )}

                {item.status === "APPROVED" && (
                  <button
                    onClick={() => handleAction(item.id, "REFUNDED")}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Process Settlement & Restock
                  </button>
                )}

                {item.status === "REFUNDED" && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Refund Settled via Original Mode
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

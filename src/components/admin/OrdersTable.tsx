"use client"
import { useState, useRef } from "react"
import { formatPrice } from "@/lib/utils"
import {
  Search,
  Truck,
  CheckCircle2,
  Calendar,
  Clock,
  AlertTriangle,
  RotateCcw,
  Download,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  Trash2,
  Video,
  Film,
  UploadCloud,
} from "lucide-react"
import { toast } from "sonner"
import InvoiceModal from "@/components/order/InvoiceModal"
import { getEffectiveDeliveryDisplay, calculateDeliveryEstimate } from "@/lib/delivery-estimate"
import DeliveryCalendarPicker from "@/components/admin/DeliveryCalendarPicker"

export interface OrderItemType {
  id: string
  productName: string
  quantity: number
  price: number
  flavor?: string | null
  size?: string | null
}

export interface DeliveryHistoryEntry {
  status: string
  timestamp: string
  note?: string
}

export interface OrderType {
  id: string
  orderNumber: string
  createdAt: string | Date
  status: string
  deliveryStatus?: string
  paymentMethod: string
  paymentStatus: string
  totalAmount: number
  user?: {
    name?: string | null
    email?: string | null
    phone?: string | null
  } | null
  address?: {
    name?: string | null
    phone?: string | null
    houseFlat?: string | null
    street?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    country?: string | null
  } | null
  items: OrderItemType[]
  trackingNumber?: string | null
  courierPartner?: string | null
  estimatedDeliveryDate?: string | Date | null
  manualDeliveryDate?: string | Date | null
  manualDeliveryTime?: string | null
  deliveryStatusHistory?: DeliveryHistoryEntry[]
}

const STATUS_TABS = [
  "ALL",
  "OVERDUE",
  "ORDER_PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]

const DELIVERY_STATUS_OPTIONS = [
  { value: "ORDER_PLACED", label: "Order Placed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PACKED", label: "Packed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURNED", label: "Returned" },
]

const POPULAR_COURIERS = [
  "Delhivery Express",
  "BlueDart Air",
  "DTDC Priority",
  "India Post Speed Post",
  "Shadowfax Local",
  "XpressBees",
  "Self / Local Delivery",
]

const TIME_SLOT_PRESETS = [
  "Morning (9:00 AM - 1:00 PM)",
  "Afternoon (1:00 PM - 5:00 PM)",
  "Evening (5:00 PM - 9:00 PM)",
  "Anytime (9:00 AM - 8:00 PM)",
]

export default function OrdersTable({ initialOrders }: { initialOrders: OrderType[] }) {
  const [orders, setOrders] = useState<OrderType[]>(initialOrders)
  const [activeTab, setActiveTab] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

  // Toggle selection
  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([])
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id))
    }
  }

  // Clear ONLY ONE order from admin panel view (MongoDB safe)
  const handleClearOneOrder = (id: string, orderNumber: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id))
    setSelectedOrderIds((prev) => prev.filter((x) => x !== id))
    toast.success(`Order #${orderNumber} cleared from admin panel view. (Saved safely in MongoDB)`)
  }

  // Clear ONLY SELECTED orders from admin panel view (MongoDB safe)
  const handleClearSelectedOrders = () => {
    if (selectedOrderIds.length === 0) return
    const count = selectedOrderIds.length
    setOrders((prev) => prev.filter((o) => !selectedOrderIds.includes(o.id)))
    setSelectedOrderIds([])
    toast.success(`${count} selected order(s) cleared from admin panel view. (Saved safely in MongoDB)`)
  }

  // Clear ALL orders from admin panel view (MongoDB safe)
  const handleClearAllOrders = () => {
    if (
      !confirm(
        "Clear all orders from the admin panel view? (Note: Your MongoDB database purchases will NOT be deleted)"
      )
    ) {
      return
    }
    setOrders([])
    setSelectedOrderIds([])
    toast.success("All orders cleared from admin panel view. (Saved safely in MongoDB)")
  }

  // Restore All orders from initialOrders
  const handleRestoreAllOrders = () => {
    setOrders(initialOrders)
    setSelectedOrderIds([])
    toast.success("All orders restored to admin panel view from database!")
  }

  // Delivery Modal State
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null)
  const [deliveryStatus, setDeliveryStatus] = useState("ORDER_PLACED")
  const [courierPartner, setCourierPartner] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [manualDate, setManualDate] = useState("")
  const [manualTime, setManualTime] = useState("")
  const [packagingVideoUrl, setPackagingVideoUrl] = useState("")
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const videoFileRef = useRef<HTMLInputElement>(null)

  const handleUploadVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingVideo(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to upload video")
      setPackagingVideoUrl(data.url)
      toast.success("Packaging video uploaded directly from gallery / files!")
    } catch (err: any) {
      toast.error(err.message || "Failed to upload video")
    } finally {
      setUploadingVideo(false)
      if (videoFileRef.current) videoFileRef.current.value = ""
    }
  }

  const openDeliveryModal = (order: OrderType) => {
    setSelectedOrder(order)
    setDeliveryStatus(order.deliveryStatus || order.status || "ORDER_PLACED")
    setCourierPartner(order.courierPartner || "")
    setTrackingNumber(order.trackingNumber || "")
    setPackagingVideoUrl((order as any).packagingVideoUrl || "")

    if (order.manualDeliveryDate) {
      const d = new Date(order.manualDeliveryDate)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      setManualDate(`${yyyy}-${mm}-${dd}`)
    } else {
      setManualDate("")
    }

    setManualTime(order.manualDeliveryTime || "")
  }

  // Check if an order is overdue
  const isOrderOverdue = (o: OrderType): boolean => {
    const curStatus = o.deliveryStatus || o.status
    if (["DELIVERED", "CANCELLED", "REFUNDED", "RETURNED"].includes(curStatus)) {
      return false
    }

    const effectiveDate = o.manualDeliveryDate || o.estimatedDeliveryDate
    if (!effectiveDate) {
      // Calculate from pincode
      const est = calculateDeliveryEstimate(o.address?.pincode, o.createdAt)
      return est.estimatedDeliveryDate.getTime() < new Date().setHours(0, 0, 0, 0)
    }

    return new Date(effectiveDate).getTime() < new Date().setHours(0, 0, 0, 0)
  }

  const overdueCount = orders.filter(isOrderOverdue).length
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
  const deliveredCount = orders.filter(
    (o) => (o.deliveryStatus || o.status) === "DELIVERED"
  ).length
  const inTransitCount = orders.filter((o) =>
    ["SHIPPED", "OUT_FOR_DELIVERY"].includes(o.deliveryStatus || o.status)
  ).length

  // Save Delivery Details
  const handleSaveDeliveryDetails = async () => {
    if (!selectedOrder) return
    setUpdatingId(selectedOrder.id)

    try {
      const payload: any = {
        deliveryStatus,
        courierPartner: courierPartner.trim() || null,
        trackingNumber: trackingNumber.trim() || null,
        manualDeliveryDate: manualDate ? new Date(manualDate).toISOString() : null,
        manualDeliveryTime: manualTime.trim() || null,
        packagingVideoUrl: packagingVideoUrl.trim() || null,
      }

      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update delivery details")

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                ...payload,
                status:
                  deliveryStatus === "DELIVERED"
                    ? "DELIVERED"
                    : deliveryStatus === "SHIPPED" || deliveryStatus === "OUT_FOR_DELIVERY"
                    ? "SHIPPED"
                    : o.status,
              }
            : o
        )
      )

      toast.success(`Delivery & shipping details saved for #${selectedOrder.orderNumber}`)
      setSelectedOrder(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to save delivery details")
    } finally {
      setUpdatingId(null)
    }
  }

  // Clear Manual Override (reverts to auto-estimate)
  const handleClearManualOverride = async () => {
    if (!selectedOrder) return
    setUpdatingId(selectedOrder.id)

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearManualOverride: true }),
      })

      if (!res.ok) throw new Error("Failed to clear manual override")

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                manualDeliveryDate: null,
                manualDeliveryTime: null,
              }
            : o
        )
      )

      setManualDate("")
      setManualTime("")
      toast.success("Manual date/time override cleared! Reverted to auto-estimate.")
    } catch (err: any) {
      toast.error(err.message || "Failed to clear manual override")
    } finally {
      setUpdatingId(null)
    }
  }

  // Clear Delivery & Tracking Data (Resets delivery details while strictly keeping purchase info)
  const handleClearAllDeliveryData = async () => {
    if (!selectedOrder) return
    if (
      !confirm(
        `Are you sure you want to clear delivery & tracking data for order #${selectedOrder.orderNumber}? Core purchase and customer info will remain safely saved in MongoDB.`
      )
    ) {
      return
    }

    setUpdatingId(selectedOrder.id)
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearDeliveryData: true, deliveryStatus: "ORDER_PLACED" }),
      })

      if (!res.ok) throw new Error("Failed to reset delivery data")

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                deliveryStatus: "ORDER_PLACED",
                manualDeliveryDate: null,
                manualDeliveryTime: null,
                trackingNumber: null,
                courierPartner: null,
                packagingVideoUrl: null,
              }
            : o
        )
      )

      setDeliveryStatus("ORDER_PLACED")
      setCourierPartner("")
      setTrackingNumber("")
      setPackagingVideoUrl("")
      setManualDate("")
      setManualTime("")
      toast.success("Delivery data cleared! Purchase information safely preserved in database.")
    } catch (err: any) {
      toast.error(err.message || "Failed to reset delivery data")
    } finally {
      setUpdatingId(null)
    }
  }

  // Quick Inline Status Change
  const handleQuickStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryStatus: newStatus,
          status:
            newStatus === "DELIVERED"
              ? "DELIVERED"
              : newStatus === "SHIPPED" || newStatus === "OUT_FOR_DELIVERY"
              ? "SHIPPED"
              : undefined,
          restock: newStatus === "RETURNED" || newStatus === "REFUNDED",
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update status")

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                deliveryStatus: newStatus,
                status:
                  newStatus === "DELIVERED"
                    ? "DELIVERED"
                    : newStatus === "SHIPPED"
                    ? "SHIPPED"
                    : o.status,
              }
            : o
        )
      )

      toast.success(`Delivery status updated to ${newStatus}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    } finally {
      setUpdatingId(null)
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Order Number,Date,Customer Name,Email,Phone,Items,Total Amount,Payment Method,Delivery Status,Carrier,Tracking,Delivery Date",
    ]
    const rows = filteredOrders.map((o) => {
      const itemsStr = o.items
        .map((i) => `${i.quantity}x ${i.productName}`)
        .join("; ")
        .replace(/,/g, " ")
      const customerName = (o.user?.name || o.address?.name || "Customer").replace(/,/g, " ")
      const dateStr = new Date(o.createdAt).toLocaleDateString()
      const effective = getEffectiveDeliveryDisplay(o)
      return `"${o.orderNumber}","${dateStr}","${customerName}","${o.user?.email || ""}","${
        o.user?.phone || o.address?.phone || ""
      }","${itemsStr}",${o.totalAmount},"${o.paymentMethod}","${o.deliveryStatus || o.status}","${
        o.courierPartner || ""
      }","${o.trackingNumber || ""}","${effective.displayDate}"`
    })

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `proteinx_orders_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Orders exported to CSV file!")
  }

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "OVERDUE") {
      if (!isOrderOverdue(o)) return false
    } else if (activeTab !== "ALL") {
      const cur = (o.deliveryStatus || o.status).toUpperCase()
      if (cur !== activeTab) return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchNum = o.orderNumber.toLowerCase().includes(q)
      const matchName = (o.user?.name || o.address?.name || "").toLowerCase().includes(q)
      const matchEmail = (o.user?.email || "").toLowerCase().includes(q)
      const matchPhone = (o.user?.phone || o.address?.phone || "").includes(q)
      const matchCourier = (o.courierPartner || "").toLowerCase().includes(q)
      const matchAwb = (o.trackingNumber || "").toLowerCase().includes(q)
      return matchNum || matchName || matchEmail || matchPhone || matchCourier || matchAwb
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Sales</p>
          <p className="text-lg font-black text-zinc-900 dark:text-white mt-0.5">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="card p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">In Transit</p>
          <p className="text-lg font-black text-blue-600 mt-0.5">{inTransitCount}</p>
        </div>
        <div className="card p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Delivered</p>
          <p className="text-lg font-black text-emerald-600 mt-0.5">{deliveredCount}</p>
        </div>
        <div
          onClick={() => setActiveTab("OVERDUE")}
          className={`card p-3.5 cursor-pointer transition-all ${
            overdueCount > 0
              ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-sm"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold tracking-wider flex items-center gap-1">
              <AlertTriangle size={11} /> Overdue Delivery
            </p>
          </div>
          <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">{overdueCount}</p>
        </div>
        <div className="card p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Orders</p>
          <p className="text-lg font-black text-zinc-900 dark:text-white mt-0.5">{orders.length}</p>
        </div>
      </div>

      {/* Controls: Search, Tabs, Export */}
      <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search order #, customer, carrier, AWB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-brand-500"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {STATUS_TABS.map((tab) => {
              const isOverdueTab = tab === "OVERDUE"
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-bold py-1.5 px-3 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                    activeTab === tab
                      ? isOverdueTab
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-brand-600 text-white shadow-sm"
                      : isOverdueTab
                      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {isOverdueTab && <AlertTriangle size={11} />}
                  {tab.replace(/_/g, " ")}
                  {isOverdueTab && overdueCount > 0 && ` (${overdueCount})`}
                </button>
              )
            })}
          </div>

          <button
            onClick={exportToCSV}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
            title="Download CSV report of filtered orders"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {selectedOrderIds.length > 0 ? (
            <button
              type="button"
              onClick={handleClearSelectedOrders}
              className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
              title="Clear only selected orders from admin panel view"
            >
              <Trash2 size={12} />
              <span>Clear Selected ({selectedOrderIds.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (orders.length > 0) {
                  handleClearOneOrder(orders[0].id, orders[0].orderNumber)
                }
              }}
              disabled={orders.length === 0}
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-40"
              title="Clear one individual order from view"
            >
              <Trash2 size={12} />
              <span>Clear One</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearAllOrders}
            className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
            title="Clear all orders from admin panel view (MongoDB database purchases stay safe)"
          >
            <Trash2 size={12} />
            <span>Clear All Data</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreAllOrders}
            disabled={orders.length >= initialOrders.length}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Recover cleared orders back to admin view from database"
          >
            <RotateCcw size={12} />
            <span>Recover {orders.length < initialOrders.length ? `(${initialOrders.length - orders.length})` : ""}</span>
          </button>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="card overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    title="Select all visible orders"
                  />
                </th>
                <th className="p-4">Order ID & Date</th>
                <th className="p-4">Customer & Destination</th>
                <th className="p-4">Carrier & Tracking AWB</th>
                <th className="p-4">Delivery Window</th>
                <th className="p-4">Total & Payment</th>
                <th className="p-4">Delivery Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-zinc-400">
                    No orders found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const overdue = isOrderOverdue(o)
                  const deliveryInfo = getEffectiveDeliveryDisplay(o)
                  const curDeliveryStatus = o.deliveryStatus || o.status

                  return (
                    <tr
                      key={o.id || o.orderNumber}
                      className={`transition-colors ${
                        overdue
                          ? "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/30"
                          : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(o.id)}
                          onChange={() => toggleSelectOrder(o.id)}
                          className="rounded border-zinc-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          title="Select order"
                        />
                      </td>

                      {/* Order ID & Date */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono font-bold text-zinc-900 dark:text-white">{o.orderNumber}</p>
                          {overdue && (
                            <span className="badge text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <AlertTriangle size={9} /> OVERDUE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <p className="font-bold text-zinc-900 dark:text-white">
                          {o.user?.name || o.address?.name || "Customer"}
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                          {o.address?.city || ""}{o.address?.state ? `, ${o.address.state}` : ""}
                          {o.address?.pincode ? ` (${o.address.pincode})` : ""}
                        </p>
                        <p className="text-zinc-400 text-[10px] font-mono">{o.user?.phone || o.address?.phone || ""}</p>
                        {(o.user?.phone || o.address?.phone) && (
                          <a
                            href={`https://wa.me/91${(o.user?.phone || o.address?.phone || "").replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                              `*NUTRA TEIN Order Update* 📦\n\nHello *${o.user?.name || o.address?.name || "Customer"}*,\nYour order *#${o.orderNumber}* status is: *${o.deliveryStatus || o.status}*.\nTotal: ₹${o.totalAmount}\n${o.courierPartner ? `Courier: ${o.courierPartner}\n` : ""}${o.trackingNumber ? `Tracking ID: ${o.trackingNumber}\n` : ""}Track live: https://nutratein.in/account/orders\n\nThank you for choosing NUTRA TEIN!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 transition-colors"
                            title="Send order update on WhatsApp"
                          >
                            <span>💬 WhatsApp Update</span>
                          </a>
                        )}
                      </td>

                      {/* Carrier & Tracking */}
                      <td className="p-4">
                        {o.trackingNumber ? (
                          <div>
                            <span className="badge text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                              <Truck size={10} />
                              {o.courierPartner || "Carrier"}
                            </span>
                            <p className="font-mono text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 font-semibold">
                              {o.trackingNumber}
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => openDeliveryModal(o)}
                            className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Truck size={12} /> + Assign Carrier
                          </button>
                        )}
                      </td>

                      {/* Delivery Date & Time */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`font-semibold text-xs flex items-center gap-1 ${
                              overdue
                                ? "text-rose-600 dark:text-rose-400 font-bold"
                                : "text-zinc-800 dark:text-zinc-200"
                            }`}
                          >
                            <Calendar size={12} className={overdue ? "text-rose-500" : "text-zinc-400"} />
                            {deliveryInfo.displayDate}
                          </span>
                          <div className="flex items-center gap-1">
                            {deliveryInfo.isManualOverride ? (
                              <span className="badge text-[9px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                Manual Override
                              </span>
                            ) : (
                              <span className="badge text-[9px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                Auto-Estimate
                              </span>
                            )}
                            {deliveryInfo.displayTime && (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                • {deliveryInfo.displayTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total & Payment */}
                      <td className="p-4">
                        <p className="font-black text-zinc-900 dark:text-white text-sm">
                          {formatPrice(o.totalAmount)}
                        </p>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <span className="text-[10px] text-zinc-400">{o.paymentMethod}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block w-fit ${
                            o.paymentStatus === "PAID"
                              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                              : o.paymentStatus === "FAILED"
                              ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
                              : o.paymentMethod === "UPI"
                              ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                          }`}>
                            {o.paymentStatus === "PAID" ? "✅ PAID"
                              : o.paymentStatus === "FAILED" ? "❌ FAILED"
                              : o.paymentMethod === "UPI" ? "⏳ VERIFY UPI"
                              : o.paymentStatus}
                          </span>
                        </div>
                      </td>


                      {/* Delivery Status Dropdown */}
                      <td className="p-4">
                        <select
                          value={curDeliveryStatus}
                          disabled={updatingId === o.id}
                          onChange={(e) => handleQuickStatusChange(o.id, e.target.value)}
                          className={`text-xs font-bold rounded-lg border px-2 py-1.5 focus:outline-none transition ${
                            curDeliveryStatus === "DELIVERED"
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                              : curDeliveryStatus === "OUT_FOR_DELIVERY"
                              ? "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                              : curDeliveryStatus === "SHIPPED"
                              ? "bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                              : curDeliveryStatus === "PACKED"
                              ? "bg-indigo-50 border-indigo-300 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                              : curDeliveryStatus === "CANCELLED"
                              ? "bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                              : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                          }`}
                        >
                          {DELIVERY_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDeliveryModal(o)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/50 border border-brand-200 dark:border-brand-800 transition-colors flex items-center gap-1.5 shadow-2xs"
                            title="Manage Delivery, Courier, Date & Time"
                          >
                            <Truck size={13} />
                            <span>Manage</span>
                          </button>

                          <InvoiceModal
                            compact={true}
                            order={{
                              orderNumber: o.orderNumber,
                              createdAt: o.createdAt,
                              status: o.status,
                              paymentMethod: o.paymentMethod,
                              paymentStatus: o.paymentStatus,
                              subtotal: o.totalAmount,
                              shippingAmount: 0,
                              totalAmount: o.totalAmount,
                              items: o.items,
                              address: o.address as any,
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => handleClearOneOrder(o.id, o.orderNumber)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900"
                            title="Clear only this order from admin panel view (MongoDB stays safe)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELIVERY MANAGEMENT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Truck size={18} className="text-brand-600" /> Delivery Management
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  Order #{selectedOrder.orderNumber} • {selectedOrder.user?.name || selectedOrder.address?.name || "Customer"}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Auto-Estimate Information Banner */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">Pincode Zone Auto-Estimate:</span>
                <span className="font-mono text-brand-600 font-bold">
                  {calculateDeliveryEstimate(selectedOrder.address?.pincode, selectedOrder.createdAt).formattedDate}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Destination: {selectedOrder.address?.city || "City"} ({selectedOrder.address?.pincode || "No PIN"}) •{" "}
                {calculateDeliveryEstimate(selectedOrder.address?.pincode, selectedOrder.createdAt).zoneName}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Delivery Status */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Delivery Status
                </label>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white"
                >
                  {DELIVERY_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Courier Partner (Manually Typed or Quick Click) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">
                    Courier / Tracking Partner Name (Type Manually)
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Delhivery Express, BlueDart Air, Local Delivery..."
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-medium"
                />
                {/* Quick Select Partner Chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {POPULAR_COURIERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCourierPartner(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        courierPartner === c
                          ? "bg-brand-600 text-white border-brand-600"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* AWB Tracking Code */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  AWB / Tracking Number (Type Manually)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEL789123456IN, BD9901423"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-mono"
                />
              </div>

              {/* Packaging Video from Gallery / Files */}
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 text-xs flex items-center gap-1.5">
                    <Video size={14} className="text-brand-600" />
                    Packaging Video for Customer
                  </label>
                  <span className="text-[10px] text-zinc-400">Optional</span>
                </div>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Upload a short recording of this customer&apos;s parcel being packed. The customer can watch it and easily share it from order tracking.
                </p>

                {/* Upload Button & Hidden Input */}
                <input
                  type="file"
                  accept="video/*"
                  ref={videoFileRef}
                  onChange={handleUploadVideoFile}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => videoFileRef.current?.click()}
                    disabled={uploadingVideo}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <UploadCloud size={14} />
                    <span>{uploadingVideo ? "Uploading from Gallery..." : "Upload from Files / Gallery"}</span>
                  </button>

                  {packagingVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setPackagingVideoUrl("")}
                      className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline px-2 py-1"
                    >
                      <Trash2 size={12} /> Remove Video
                    </button>
                  )}
                </div>

                {/* Video Preview if URL exists */}
                {packagingVideoUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden bg-black aspect-video relative max-w-xs border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <video
                      src={packagingVideoUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Or paste link */}
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Or paste video link: https://.../video.mp4"
                    value={packagingVideoUrl}
                    onChange={(e) => setPackagingVideoUrl(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] text-zinc-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Interactive Delivery Calendar & Time Slot Picker */}
              <DeliveryCalendarPicker
                selectedDate={manualDate}
                selectedTime={manualTime}
                onDateChange={(d) => setManualDate(d)}
                onTimeChange={(t) => setManualTime(t)}
                onClearOverride={manualDate || manualTime ? handleClearManualOverride : undefined}
                autoEstimateDate={calculateDeliveryEstimate(selectedOrder.address?.pincode, selectedOrder.createdAt).formattedDate}
                autoEstimateZone={calculateDeliveryEstimate(selectedOrder.address?.pincode, selectedOrder.createdAt).zoneName}
                orderNumber={selectedOrder.orderNumber}
                customerName={selectedOrder.user?.name || selectedOrder.user?.email || "Customer"}
                address={[selectedOrder.address?.street, selectedOrder.address?.city, selectedOrder.address?.state, selectedOrder.address?.pincode].filter(Boolean).join(", ")}
                courierPartner={courierPartner}
                trackingNumber={trackingNumber}
              />

              {/* Status Audit History */}
              {selectedOrder.deliveryStatusHistory && selectedOrder.deliveryStatusHistory.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="font-bold text-zinc-500 uppercase text-[10px] tracking-wider">
                    Status History & Audit Log
                  </p>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {selectedOrder.deliveryStatusHistory.map((h, i) => (
                      <div
                        key={i}
                        className="text-[10px] flex items-center justify-between p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400"
                      >
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {h.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(h.timestamp).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── UPI Payment Verification Panel ───────────────────────── */}
            {selectedOrder.paymentMethod === "UPI" && (
              <div className={`rounded-xl border p-4 space-y-3 text-xs ${
                selectedOrder.paymentStatus === "PAID"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                  : selectedOrder.paymentStatus === "FAILED"
                  ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                  : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    selectedOrder.paymentStatus === "PAID"
                      ? "bg-emerald-500"
                      : selectedOrder.paymentStatus === "FAILED"
                      ? "bg-rose-500"
                      : "bg-amber-500"
                  }`}>
                    <ShieldCheck size={13} className="text-white" />
                  </div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">UPI Payment Verification</p>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedOrder.paymentStatus === "PAID"
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                      : selectedOrder.paymentStatus === "FAILED"
                      ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
                      : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                  }`}>
                    {selectedOrder.paymentStatus === "PAID"
                      ? "✅ PAID"
                      : selectedOrder.paymentStatus === "FAILED"
                      ? "❌ NOT RECEIVED"
                      : "⏳ PENDING VERIFICATION"}
                  </span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                  Customer paid via UPI. Check your bank app / UPI app for a transaction of{" "}
                  <strong className="text-zinc-800 dark:text-zinc-200">{formatPrice(selectedOrder.totalAmount)}</strong> from the customer.
                  Then mark the status below.
                </p>
                {selectedOrder.paymentStatus !== "PAID" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={updatingId === selectedOrder.id}
                      onClick={async () => {
                        setUpdatingId(selectedOrder.id)
                        try {
                          const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ paymentStatus: "PAID", status: "CONFIRMED" }),
                          })
                          if (!res.ok) throw new Error("Failed")
                          setOrders((prev) =>
                            prev.map((o) =>
                              o.id === selectedOrder.id
                                ? { ...o, paymentStatus: "PAID", status: "CONFIRMED" }
                                : o
                            )
                          )
                          setSelectedOrder((prev) =>
                            prev ? { ...prev, paymentStatus: "PAID", status: "CONFIRMED" } : null
                          )
                          toast.success("Payment marked as PAID ✅")
                        } catch {
                          toast.error("Failed to update payment status")
                        } finally {
                          setUpdatingId(null)
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-xs"
                    >
                      <CheckCircle2 size={13} /> Mark as Paid
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === selectedOrder.id}
                      onClick={async () => {
                        setUpdatingId(selectedOrder.id)
                        try {
                          const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ paymentStatus: "FAILED" }),
                          })
                          if (!res.ok) throw new Error("Failed")
                          setOrders((prev) =>
                            prev.map((o) =>
                              o.id === selectedOrder.id
                                ? { ...o, paymentStatus: "FAILED" }
                                : o
                            )
                          )
                          setSelectedOrder((prev) =>
                            prev ? { ...prev, paymentStatus: "FAILED" } : null
                          )
                          toast.success("Marked as payment not received")
                        } catch {
                          toast.error("Failed to update payment status")
                        } finally {
                          setUpdatingId(null)
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-xs"
                    >
                      <AlertTriangle size={13} /> Not Received
                    </button>
                  </div>
                )}
                {selectedOrder.paymentStatus === "PAID" && (
                  <button
                    type="button"
                    disabled={updatingId === selectedOrder.id}
                    onClick={async () => {
                      setUpdatingId(selectedOrder.id)
                      try {
                        await fetch(`/api/admin/orders/${selectedOrder.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ paymentStatus: "PENDING" }),
                        })
                        setOrders((prev) =>
                          prev.map((o) =>
                            o.id === selectedOrder.id ? { ...o, paymentStatus: "PENDING" } : o
                          )
                        )
                        setSelectedOrder((prev) =>
                          prev ? { ...prev, paymentStatus: "PENDING" } : null
                        )
                        toast("Payment reverted to Pending")
                      } finally {
                        setUpdatingId(null)
                      }
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
                  >
                    Undo — revert to Pending
                  </button>
                )}
              </div>
            )}

            {/* Modal Footer with Clear All Data and Save */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleClearAllDeliveryData}
                disabled={updatingId === selectedOrder.id}
                className="w-full sm:w-auto text-xs font-bold text-rose-600 hover:text-rose-700 dark:hover:text-rose-400 py-1.5 px-3 rounded-lg border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center gap-1"
                title="Clears manual delivery overrides and tracking while preserving original customer & purchase info"
              >
                <RotateCcw size={12} /> Clear Delivery Data
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDeliveryDetails}
                  disabled={updatingId === selectedOrder.id}
                  className="btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-initial"
                >
                  {updatingId === selectedOrder.id ? "Saving to Database..." : "Save to MongoDB"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

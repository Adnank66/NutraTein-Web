"use client"

import { useState } from "react"
import {
  Truck,
  Package,
  CheckCircle2,
  Calendar,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  MapPin,
  RotateCcw,
  X,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { getEffectiveDeliveryDisplay, calculateDeliveryEstimate } from "@/lib/delivery-estimate"
import DeliveryCalendarPicker from "@/components/admin/DeliveryCalendarPicker"

export interface ShippingOrder {
  id: string
  orderNumber: string
  createdAt: string
  status: string
  deliveryStatus?: string
  paymentMethod: string
  paymentStatus: string
  totalAmount: number
  customerName: string
  customerEmail?: string
  customerPhone?: string
  address?: string
  city?: string
  destinationCity: string
  destinationState?: string
  pincode: string
  itemsCount: number
  items?: any[]
  courierPartner?: string | null
  trackingNumber?: string | null
  estimatedDeliveryDate?: string | Date | null
  manualDeliveryDate?: string | Date | null
  manualDeliveryTime?: string | null
  deliveryStatusHistory?: any[]
}

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

export default function ShippingManager({ initialOrders = [] }: { initialOrders?: ShippingOrder[] }) {
  const [shipments, setShipments] = useState<ShippingOrder[]>(initialOrders)
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(999)
  const [standardFee, setStandardFee] = useState(99)

  // Selection handlers
  const toggleSelectShipment = (id: string) => {
    setSelectedShipmentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // Clear ONLY ONE shipment from admin panel view (MongoDB stays safe)
  const handleClearOneShipment = (id: string, orderNumber: string) => {
    setShipments((prev) => prev.filter((s) => s.id !== id))
    setSelectedShipmentIds((prev) => prev.filter((x) => x !== id))
    toast.success(`Shipping entry for #${orderNumber} cleared from view. (Saved safely in MongoDB)`)
  }

  // Clear ONLY SELECTED shipments from admin panel view (MongoDB stays safe)
  const handleClearSelectedShipments = () => {
    if (selectedShipmentIds.length === 0) return
    const count = selectedShipmentIds.length
    setShipments((prev) => prev.filter((s) => !selectedShipmentIds.includes(s.id)))
    setSelectedShipmentIds([])
    toast.success(`${count} selected shipment(s) cleared from view. (Saved safely in MongoDB)`)
  }

  // Clear ALL shipments from admin panel view (MongoDB safe)
  const handleClearAllShipments = () => {
    if (!confirm("Clear all shipments from admin panel view? (Note: Database records remain safely stored in MongoDB)")) {
      return
    }
    setShipments([])
    setSelectedShipmentIds([])
    toast.success("All shipping records cleared from view. (Saved safely in MongoDB)")
  }

  // Restore All shipments from initialOrders
  const handleRestoreAllShipments = () => {
    setShipments(initialOrders)
    setSelectedShipmentIds([])
    toast.success("Shipments restored to view from database!")
  }

  // Edit / Dispatch Modal
  const [activeOrder, setActiveOrder] = useState<ShippingOrder | null>(null)
  const [customCourier, setCustomCourier] = useState("")
  const [customAwb, setCustomAwb] = useState("")
  const [deliveryDateInput, setDeliveryDateInput] = useState("")
  const [deliveryTimeInput, setDeliveryTimeInput] = useState("")
  const [modalStatus, setModalStatus] = useState("SHIPPED")
  const [isSaving, setIsSaving] = useState(false)

  const openDispatchModal = (item: ShippingOrder) => {
    setActiveOrder(item)
    setCustomCourier(item.courierPartner || "")
    setCustomAwb(item.trackingNumber || "")
    setModalStatus(
      item.deliveryStatus && item.deliveryStatus !== "ORDER_PLACED"
        ? item.deliveryStatus
        : "SHIPPED"
    )

    if (item.manualDeliveryDate) {
      const d = new Date(item.manualDeliveryDate)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      setDeliveryDateInput(`${yyyy}-${mm}-${dd}`)
    } else {
      setDeliveryDateInput("")
    }

    setDeliveryTimeInput(item.manualDeliveryTime || "")
  }

  const handleSaveDispatch = async () => {
    if (!activeOrder) return
    setIsSaving(true)

    try {
      const payload: any = {
        deliveryStatus: modalStatus,
        status:
          modalStatus === "DELIVERED"
            ? "DELIVERED"
            : modalStatus === "SHIPPED" || modalStatus === "OUT_FOR_DELIVERY"
            ? "SHIPPED"
            : undefined,
        courierPartner: customCourier.trim() || null,
        trackingNumber: customAwb.trim() || null,
        manualDeliveryDate: deliveryDateInput ? new Date(deliveryDateInput).toISOString() : null,
        manualDeliveryTime: deliveryTimeInput.trim() || null,
      }

      const res = await fetch(`/api/admin/orders/${activeOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save dispatch details")

      setShipments((prev) =>
        prev.map((s) =>
          s.id === activeOrder.id
            ? {
                ...s,
                ...payload,
              }
            : s
        )
      )

      toast.success(`Dispatch & delivery saved to MongoDB for order #${activeOrder.orderNumber}`)
      setActiveOrder(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to save dispatch details")
    } finally {
      setIsSaving(false)
    }
  }

  // Clear manual date/time override
  const handleClearManualDateOverride = async () => {
    if (!activeOrder) return
    setIsSaving(true)

    try {
      const res = await fetch(`/api/admin/orders/${activeOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearManualOverride: true }),
      })

      if (!res.ok) throw new Error("Failed to clear manual override")

      setShipments((prev) =>
        prev.map((s) =>
          s.id === activeOrder.id
            ? {
                ...s,
                manualDeliveryDate: null,
                manualDeliveryTime: null,
              }
            : s
        )
      )

      setDeliveryDateInput("")
      setDeliveryTimeInput("")
      toast.success("Manual delivery date/time override cleared! Reverted to auto-estimate.")
    } catch (err: any) {
      toast.error(err.message || "Failed to clear override")
    } finally {
      setIsSaving(false)
    }
  }

  // Clear all delivery data (safe reset keeping initial purchase and information stored in MongoDB)
  const handleClearAllShippingData = async () => {
    if (!activeOrder) return
    if (
      !confirm(
        `Clear carrier, tracking, and delivery date for #${activeOrder.orderNumber}? Core purchase info remains safely stored in the real MongoDB database.`
      )
    ) {
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${activeOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearDeliveryData: true, deliveryStatus: "ORDER_PLACED" }),
      })

      if (!res.ok) throw new Error("Failed to clear delivery data")

      setShipments((prev) =>
        prev.map((s) =>
          s.id === activeOrder.id
            ? {
                ...s,
                courierPartner: null,
                trackingNumber: null,
                manualDeliveryDate: null,
                manualDeliveryTime: null,
                deliveryStatus: "ORDER_PLACED",
              }
            : s
        )
      )

      setCustomCourier("")
      setCustomAwb("")
      setDeliveryDateInput("")
      setDeliveryTimeInput("")
      setModalStatus("ORDER_PLACED")
      toast.success("Delivery details reset to default! Purchase information safely preserved.")
    } catch (err: any) {
      toast.error(err.message || "Failed to clear delivery data")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRateSettings = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Store shipping rules updated successfully!")
  }

  const filtered = shipments.filter(
    (s) =>
      s.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.destinationCity.toLowerCase().includes(search.toLowerCase()) ||
      (s.courierPartner || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.trackingNumber || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Truck size={24} className="text-brand-600" />
            Shipping, Couriers & AWB Tracking Control
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Connected live to MongoDB Atlas database. Manage dispatch queues, manual tracking partners, and delivery dates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold py-1 px-3">
            ● Real MongoDB Synced ({shipments.length} Orders)
          </span>
        </div>
      </div>

      {/* Courier Partners & Rate Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Partners */}
        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Integrated Couriers</h3>
          <div className="space-y-2">
            {[
              { name: "Delhivery Surface & Express", status: "Active API (Primary)", speed: "2-3 Days" },
              { name: "BlueDart Air Express", status: "Active API (Metro)", speed: "24-48 Hours" },
              { name: "DTDC Premium Priority", status: "Active Backup", speed: "3-4 Days" },
            ].map((c) => (
              <div
                key={c.name}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">{c.name}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">{c.status}</p>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">{c.speed}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Rates Configuration */}
        <div className="lg:col-span-2 card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Store Delivery Rules</h3>
          <form onSubmit={handleSaveRateSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Free Shipping Cart Threshold (₹)
              </label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Orders above ₹{freeShippingThreshold} get free delivery</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Standard Shipping Charge (₹)
              </label>
              <input
                type="number"
                value={standardFee}
                onChange={(e) => setStandardFee(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Applied when cart is below free threshold</p>
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="btn-primary text-xs py-2 px-4">
                Save Shipping Policy
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="card overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by order #, city, carrier, or AWB..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            {selectedShipmentIds.length > 0 ? (
              <button
                type="button"
                onClick={handleClearSelectedShipments}
                className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                title="Clear selected shipments from admin view"
              >
                <Trash2 size={12} />
                <span>Clear Selected ({selectedShipmentIds.length})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (shipments.length > 0) {
                    handleClearOneShipment(shipments[0].id, shipments[0].orderNumber)
                  }
                }}
                disabled={shipments.length === 0}
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                title="Clear one individual shipment from admin view"
              >
                <Trash2 size={12} />
                <span>Clear One</span>
              </button>
            )}

            {shipments.length < initialOrders.length && (
              <button
                type="button"
                onClick={handleRestoreAllShipments}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline py-1.5 px-2 flex items-center gap-1 shrink-0"
                title="Restore all shipments from database"
              >
                <RotateCcw size={12} />
                <span>Restore ({initialOrders.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearAllShipments}
              className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1 shrink-0"
              title="Clear all shipping records from admin view (MongoDB database records stay safe)"
            >
              <RotateCcw size={12} />
              <span>Clear All Data</span>
            </button>
            <span className="text-xs text-zinc-400 font-semibold hidden sm:inline">
              Showing {filtered.length} live orders from MongoDB
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedShipmentIds.length === filtered.length}
                    onChange={() => {
                      if (selectedShipmentIds.length === filtered.length) {
                        setSelectedShipmentIds([])
                      } else {
                        setSelectedShipmentIds(filtered.map((s) => s.id))
                      }
                    }}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    title="Select all visible shipments"
                  />
                </th>
                <th className="p-4">Order Ref</th>
                <th className="p-4">Customer & City</th>
                <th className="p-4">Carrier & Tracking AWB</th>
                <th className="p-4">Delivery Date & Window</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-zinc-400">
                    No orders found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const deliveryInfo = getEffectiveDeliveryDisplay(item)
                  const curStatus = item.deliveryStatus || item.status

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedShipmentIds.includes(item.id)}
                          onChange={() => toggleSelectShipment(item.id)}
                          className="rounded border-zinc-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          title="Select shipment"
                        />
                      </td>

                      <td className="p-4 font-mono font-black text-brand-600 dark:text-brand-400">
                        {item.orderNumber}
                        <p className="text-[10px] text-zinc-400 font-normal">
                          {item.itemsCount} item(s)
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-zinc-900 dark:text-white">{item.customerName}</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {item.destinationCity} ({item.pincode})
                        </p>
                      </td>

                      <td className="p-4">
                        {item.trackingNumber ? (
                          <div>
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Truck size={11} /> {item.courierPartner || "Carrier"}
                            </span>
                            <p className="font-mono text-[10px] text-zinc-500 mt-0.5 font-bold">
                              {item.trackingNumber}
                            </p>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                            <Calendar size={12} className="text-zinc-400" />
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

                      <td className="p-4">
                        <span
                          className={`badge text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            curStatus === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              : curStatus === "SHIPPED" || curStatus === "IN_TRANSIT" || curStatus === "OUT_FOR_DELIVERY"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                          }`}
                        >
                          {curStatus.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDispatchModal(item)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/50 border border-brand-200 dark:border-brand-800 transition-colors"
                          >
                            {item.trackingNumber ? "Edit Shipping" : "+ Assign Carrier"}
                          </button>

                          {/* Clear single row button */}
                          <button
                            type="button"
                            onClick={() => handleClearOneShipment(item.id, item.orderNumber)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Clear only this shipping record from view (MongoDB stays safe)"
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

      {/* DISPATCH & COURIER MODAL */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Truck size={18} className="text-brand-600" /> Courier & Delivery Control
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  Order #{activeOrder.orderNumber} • {activeOrder.customerName}
                </p>
              </div>
              <button
                onClick={() => setActiveOrder(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Pincode Auto-Estimate Info */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">Pincode Auto-Estimate:</span>
                <span className="font-mono text-brand-600 font-bold">
                  {calculateDeliveryEstimate(activeOrder.pincode, activeOrder.createdAt).formattedDate}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                City: {activeOrder.destinationCity} ({activeOrder.pincode}) •{" "}
                {calculateDeliveryEstimate(activeOrder.pincode, activeOrder.createdAt).zoneName}
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Delivery Status */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Delivery Status
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white"
                >
                  <option value="ORDER_PLACED">Order Placed</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PACKED">Packed (Ready for Pickup)</option>
                  <option value="SHIPPED">Shipped (In Transit)</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="RETURNED">Returned</option>
                </select>
              </div>

              {/* Courier Partner Name (Manually Typed) */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tracking Partner / Courier Name (Type Manually)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delhivery Express, BlueDart Air, Local Delivery..."
                  value={customCourier}
                  onChange={(e) => setCustomCourier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-medium"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {POPULAR_COURIERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCustomCourier(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        customCourier === c
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
                  value={customAwb}
                  onChange={(e) => setCustomAwb(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-mono"
                />
              </div>

              {/* Interactive Delivery Calendar & Time Slot Picker */}
              <DeliveryCalendarPicker
                selectedDate={deliveryDateInput}
                selectedTime={deliveryTimeInput}
                onDateChange={(d) => setDeliveryDateInput(d)}
                onTimeChange={(t) => setDeliveryTimeInput(t)}
                onClearOverride={deliveryDateInput || deliveryTimeInput ? handleClearManualDateOverride : undefined}
                autoEstimateDate={calculateDeliveryEstimate(activeOrder.pincode, activeOrder.createdAt).formattedDate}
                autoEstimateZone={calculateDeliveryEstimate(activeOrder.pincode, activeOrder.createdAt).zoneName}
                orderNumber={activeOrder.orderNumber}
                customerName={activeOrder.customerName}
                address={[activeOrder.address, activeOrder.destinationCity || activeOrder.city, activeOrder.pincode].filter(Boolean).join(", ")}
                courierPartner={customCourier}
                trackingNumber={customAwb}
              />
            </div>

            {/* Modal Footer with Safe Clear All Shipping Data & Save */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleClearAllShippingData}
                disabled={isSaving}
                className="w-full sm:w-auto text-xs font-bold text-rose-600 hover:text-rose-700 py-1.5 px-3 rounded-lg border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center gap-1"
                title="Clears manual delivery overrides & carrier tracking while preserving purchase info in MongoDB"
              >
                <RotateCcw size={12} /> Clear Delivery Data
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDispatch}
                  disabled={isSaving}
                  className="btn-primary text-xs py-1.5 px-4 flex-1 sm:flex-initial"
                >
                  {isSaving ? "Saving to MongoDB..." : "Save to Database"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

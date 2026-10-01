"use client"
import { useState } from "react"
import { Printer, X, Zap } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface InvoiceModalProps {
  order: {
    orderNumber?: string
    createdAt?: string | Date | null
    status?: string
    paymentMethod?: string
    paymentStatus?: string
    subtotal?: number | null
    shippingAmount?: number | null
    totalAmount?: number | null
    items?: any[]
    address?: any
  }
  compact?: boolean
  triggerLabel?: string
  className?: string
}

export default function InvoiceModal({
  order,
  compact = false,
  triggerLabel,
  className = "",
}: InvoiceModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!order) return null

  const handlePrint = () => {
    window.print()
  }

  // Safe data extraction
  const orderNumber = order.orderNumber || "ORDER"
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recent"
  const paymentMethod = order.paymentMethod || "COD"
  const paymentStatus = order.paymentStatus || "PENDING"
  const totalAmount = Number(order.totalAmount) || 0
  const shippingAmount = Number(order.shippingAmount) || 0
  const subtotal = order.subtotal !== undefined && order.subtotal !== null ? Number(order.subtotal) : totalAmount - shippingAmount

  // Safe items extraction
  let items: any[] = []
  if (Array.isArray(order.items)) {
    items = order.items
  } else if (typeof order.items === "string") {
    try {
      items = JSON.parse(order.items)
    } catch {
      items = []
    }
  }

  // Safe address extraction
  let address: any = null
  if (order.address && typeof order.address === "object") {
    address = order.address
  } else if (typeof order.address === "string") {
    try {
      address = JSON.parse(order.address)
    } catch {
      address = { street: order.address }
    }
  }

  const gstAmount = Math.round((totalAmount * 0.18) / 1.18)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          (compact
            ? "px-2.5 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors flex items-center gap-1 shrink-0"
            : "btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5")
        }
        title="View & Print Tax Invoice"
      >
        <Printer size={compact ? 12 : 13} />
        <span>{triggerLabel || (compact ? "Invoice" : "View & Print Tax Invoice")}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm print:p-0 print:bg-white animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden print:border-0 print:shadow-none print:max-w-none max-h-[90vh] overflow-y-auto">
            {/* Header / Actions */}
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-zinc-800">TAX INVOICE / OFFICIAL BILL</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                >
                  <Printer size={13} /> Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 space-y-6 text-xs text-zinc-800 bg-white">
              {/* Top brand & meta */}
              <div className="flex justify-between items-start pb-6 border-b border-zinc-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center">
                      <Zap size={14} className="text-brand-500 fill-brand-500" />
                    </div>
                    <span className="font-display text-lg font-black tracking-tight text-zinc-950">
                      PROTEIN<span className="text-brand-600">X</span>
                    </span>
                  </div>
                  <p className="text-zinc-500 text-[11px]">PROTEINX Nutrition Private Limited</p>
                  <p className="text-zinc-500 text-[11px]">GSTIN: 27AABCP1234F1Z5</p>
                  <p className="text-zinc-500 text-[11px]">Kalyan West, Mumbai, Maharashtra 421311</p>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-bold bg-zinc-900 text-white rounded">
                    Official Invoice
                  </span>
                  <p className="font-mono font-bold text-zinc-950 text-sm mt-1">Invoice #{orderNumber}</p>
                  <p className="text-zinc-500 text-[11px]">Date: {orderDate}</p>
                  <p className="text-zinc-500 text-[11px]">Payment: {paymentMethod} ({paymentStatus})</p>
                </div>
              </div>

              {/* Billed to */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="font-bold text-zinc-900 mb-1">Shipping & Billing Address:</p>
                {address ? (
                  <div className="text-zinc-600 space-y-0.5 text-[11px]">
                    {address.name && <p className="font-semibold text-zinc-900">{address.name}</p>}
                    <p>
                      {[address.houseFlat, address.street].filter(Boolean).join(", ") || "Address provided at checkout"}
                    </p>
                    <p>
                      {[address.city, address.state].filter(Boolean).join(", ")}
                      {address.pincode ? ` - ${address.pincode}` : ""}
                      {address.country ? `, ${address.country}` : ""}
                    </p>
                    {address.phone && <p>Phone: {address.phone}</p>}
                  </div>
                ) : (
                  <p className="text-zinc-400">Customer address recorded with order #{orderNumber}.</p>
                )}
              </div>

              {/* Itemized Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {items.length > 0 ? (
                      items.map((i: any, idx: number) => {
                        const q = Number(i.quantity) || 1
                        const p = Number(i.price) || 0
                        return (
                          <tr key={i.id || `item-${idx}`}>
                            <td className="p-2.5">
                              <p className="font-bold text-zinc-900">{i.productName || i.name || "Supplement Formula"}</p>
                              {(i.flavor || i.size) && (
                                <p className="text-[10px] text-zinc-500">
                                  {[i.flavor, i.size].filter(Boolean).join(" • ")}
                                </p>
                              )}
                            </td>
                            <td className="p-2.5 text-center">{q}</td>
                            <td className="p-2.5 text-right">{formatPrice(p)}</td>
                            <td className="p-2.5 text-right font-bold text-zinc-900">{formatPrice(p * q)}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td className="p-2.5 font-bold text-zinc-900">Standard Supplements Order</td>
                        <td className="p-2.5 text-center">1</td>
                        <td className="p-2.5 text-right">{formatPrice(totalAmount)}</td>
                        <td className="p-2.5 text-right font-bold text-zinc-900">{formatPrice(totalAmount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="pt-4 border-t border-zinc-200 space-y-1.5 text-right">
                <div className="flex justify-end gap-10">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="font-semibold text-zinc-900 w-28">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-end gap-10">
                  <span className="text-zinc-500">Shipping Charges</span>
                  <span className="font-semibold text-zinc-900 w-28">
                    {shippingAmount === 0 ? "FREE (0.00)" : formatPrice(shippingAmount)}
                  </span>
                </div>
                <div className="flex justify-end gap-10">
                  <span className="text-zinc-500">Applicable GST (18% Included)</span>
                  <span className="font-semibold text-zinc-900 w-28">{formatPrice(gstAmount)}</span>
                </div>
                <div className="flex justify-end gap-10 text-sm font-black text-zinc-950 pt-2 border-t border-zinc-200">
                  <span>Grand Total</span>
                  <span className="w-28 text-brand-600">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              {/* Footer notes */}
              <div className="pt-6 border-t border-zinc-200 text-center text-[10px] text-zinc-400 space-y-1">
                <p>This is a computer-generated tax invoice and requires no physical signature.</p>
                <p>For order or delivery queries, contact adnankazi275@gmail.com or WhatsApp support.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
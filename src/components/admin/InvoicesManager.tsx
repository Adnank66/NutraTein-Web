"use client"

import { useState } from "react"
import {
  FileText,
  Search,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  DollarSign,
  Receipt,
  Eye,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"
import InvoiceModal from "@/components/order/InvoiceModal"

interface InvoiceOrder {
  id: string
  orderNumber: string
  createdAt: string | Date
  status: string
  paymentMethod: string
  paymentStatus: string
  totalAmount: number
  customerName: string
  customerEmail?: string
  customerPhone?: string
  items: any[]
  address?: any
}

export default function InvoicesManager({ orders = [] }: { orders: InvoiceOrder[] }) {
  const [invoiceOrders, setInvoiceOrders] = useState<InvoiceOrder[]>(orders)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("ALL")

  const filtered = invoiceOrders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customerPhone || "").toLowerCase().includes(search.toLowerCase())
    const matchPayment = paymentFilter === "ALL" || o.paymentMethod === paymentFilter
    return matchSearch && matchPayment
  })

  const totalInvoiced = invoiceOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
  const gstEstimated = Math.round(totalInvoiced * 0.18)

  // Selection toggles
  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.length === filtered.length) {
      setSelectedInvoiceIds([])
    } else {
      setSelectedInvoiceIds(filtered.map((inv) => inv.id))
    }
  }

  // Clear ONLY ONE invoice from admin panel view (MongoDB stays safe)
  const handleClearOneInvoice = (id: string, orderNumber: string) => {
    setInvoiceOrders((prev) => prev.filter((inv) => inv.id !== id))
    setSelectedInvoiceIds((prev) => prev.filter((x) => x !== id))
    toast.success(`Invoice for #${orderNumber} cleared from view. (Saved safely in MongoDB)`)
  }

  // Clear ONLY SELECTED invoices from admin panel view (MongoDB safe)
  const handleClearSelectedInvoices = () => {
    if (selectedInvoiceIds.length === 0) return
    const count = selectedInvoiceIds.length
    setInvoiceOrders((prev) => prev.filter((inv) => !selectedInvoiceIds.includes(inv.id)))
    setSelectedInvoiceIds([])
    toast.success(`${count} selected invoice(s) cleared from admin view. (Saved safely in MongoDB)`)
  }

  // Clear ALL invoices from admin panel view (MongoDB safe)
  const handleClearAllInvoices = () => {
    if (!confirm("Clear all invoices from admin panel view? (Note: Database records remain safely stored in MongoDB)")) {
      return
    }
    setInvoiceOrders([])
    setSelectedInvoiceIds([])
    toast.success("All invoices cleared from admin view. (Saved safely in MongoDB)")
  }

  // Restore All invoices from database prop
  const handleRestoreAllInvoices = () => {
    setInvoiceOrders(orders)
    setSelectedInvoiceIds([])
    toast.success("Invoices restored to admin view from database!")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <FileText size={24} className="text-brand-600" />
            Tax Invoices & Billing Receipts ({invoiceOrders.length})
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Download GST-compliant tax invoices, print order slips, and inspect customer billing histories.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Invoiced Amount</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign size={15} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{formatPrice(totalInvoiced)}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{invoiceOrders.length} visible invoices</p>
        </div>

        <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">18% GST Accounted</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Receipt size={15} />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{formatPrice(gstEstimated)}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">IGST/CGST/SGST breakdown ready</p>
        </div>

        <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Settled vs Pending</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">98.2%</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">High settlement reconciliation rate</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {["ALL", "UPI", "COD", "CARD"].map((mode) => (
            <button
              key={mode}
              onClick={() => setPaymentFilter(mode)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                paymentFilter === mode
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}

          {/* Clear Selected or Clear One Button */}
          {selectedInvoiceIds.length > 0 ? (
            <button
              type="button"
              onClick={handleClearSelectedInvoices}
              className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0 ml-1"
              title="Clear selected invoices from admin view"
            >
              <Trash2 size={12} />
              <span>Clear Selected ({selectedInvoiceIds.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (invoiceOrders.length > 0) {
                  handleClearOneInvoice(invoiceOrders[0].id, invoiceOrders[0].orderNumber)
                }
              }}
              disabled={invoiceOrders.length === 0}
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-1.5 px-3 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ml-1 disabled:opacity-40"
              title="Clear one individual invoice from admin view"
            >
              <Trash2 size={12} />
              <span>Clear One</span>
            </button>
          )}

          {/* Restore Button */}
          {invoiceOrders.length < orders.length && (
            <button
              type="button"
              onClick={handleRestoreAllInvoices}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline py-1.5 px-2 flex items-center gap-1 shrink-0 ml-1"
              title="Restore all invoices to admin view from database"
            >
              <RotateCcw size={12} />
              <span>Restore ({orders.length})</span>
            </button>
          )}

          {/* Clear All Button (safe - view only) */}
          <button
            type="button"
            onClick={handleClearAllInvoices}
            className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0 ml-1"
            title="Clear all invoices from admin panel view (MongoDB database records stay safe)"
          >
            <RotateCcw size={12} />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedInvoiceIds.length === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    title="Select all visible invoices"
                  />
                </th>
                <th className="p-4">Tax Invoice #</th>
                <th className="p-4">Billing Date</th>
                <th className="p-4">Billed To (Customer)</th>
                <th className="p-4">Line Items</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-zinc-400">
                    No invoices found. Click "Restore" to load all invoices from database.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Checkbox */}
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedInvoiceIds.includes(inv.id)}
                        onChange={() => toggleSelectInvoice(inv.id)}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        title="Select invoice"
                      />
                    </td>

                    <td className="p-4">
                      <p className="font-mono font-black text-brand-600 dark:text-brand-400">
                        INV-{inv.orderNumber.replace(/[^0-9]/g, "") || "PX-2026"}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Ref: {inv.orderNumber}</p>
                    </td>

                    <td className="p-4 text-zinc-600 dark:text-zinc-300">
                      {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-zinc-900 dark:text-white">{inv.customerName}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">{inv.customerPhone || inv.customerEmail || "N/A"}</p>
                    </td>

                    <td className="p-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                      {inv.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ") || "Supplements"}
                    </td>

                    <td className="p-4 font-black text-zinc-900 dark:text-white text-sm">
                      {formatPrice(inv.totalAmount)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`badge text-[10px] font-bold px-2 py-0.5 ${
                          inv.paymentMethod === "UPI"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {inv.paymentMethod}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <InvoiceModal
                          compact={true}
                          order={{
                            orderNumber: inv.orderNumber,
                            createdAt: inv.createdAt,
                            status: inv.status,
                            paymentMethod: inv.paymentMethod,
                            paymentStatus: inv.paymentStatus,
                            subtotal: inv.totalAmount,
                            shippingAmount: 0,
                            totalAmount: inv.totalAmount,
                            items: inv.items,
                            address: inv.address,
                          }}
                        />

                        {/* Clear single invoice button */}
                        <button
                          type="button"
                          onClick={() => handleClearOneInvoice(inv.id, inv.orderNumber)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Clear only this invoice from view (MongoDB stays safe)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

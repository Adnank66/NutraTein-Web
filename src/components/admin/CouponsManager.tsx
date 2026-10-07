"use client"

import { useState } from "react"
import { formatPrice } from "@/lib/utils"
import { Plus, Tag, Trash2, Power, CheckCircle, AlertCircle, X, Percent, IndianRupee } from "lucide-react"
import { toast } from "sonner"

interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  minOrderValue: number
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  productId?: string | null
  productName?: string | null
  productImage?: string | null
}

export default function CouponsManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState("")

  // Form State
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENT",
    discountValue: "",
    minOrderValue: "0",
    maxDiscount: "",
    usageLimit: "",
    expiresAt: "",
    isActive: true,
    productId: "",
    productName: "",
    productImage: "",
  })

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  )

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
      })

      if (!res.ok) throw new Error("Failed to update status")

      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
      )
      toast.success(`Promo code ${coupon.code} is now ${!coupon.isActive ? "ACTIVE" : "INACTIVE"}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    }
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete promo code ${code}?`)) return

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete promo code")

      setCoupons((prev) => prev.filter((c) => c.id !== id))
      toast.success(`Promo code ${code} deleted`)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete promo code")
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.discountValue) {
      toast.error("Please enter code and discount value")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create promo code")

      setCoupons((prev) => [data.coupon, ...prev])
      toast.success(`Promo code ${data.coupon.code} created successfully!`)
      setIsModalOpen(false)
      setForm({
        code: "",
        description: "",
        discountType: "PERCENT",
        discountValue: "",
        minOrderValue: "0",
        maxDiscount: "",
        usageLimit: "",
        expiresAt: "",
        isActive: true,
        productId: "",
        productName: "",
        productImage: "",
      })
    } catch (err: any) {
      toast.error(err.message || "Error creating promo code")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Promo Code Manager ({coupons.length})</h1>
          <p className="text-xs text-dark-500 mt-0.5">
            Create, activate, deactivate, and track customer discount codes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(!isModalOpen)}
          className={`text-xs flex items-center gap-1.5 self-start sm:self-auto py-2 px-4 shadow-sm rounded-xl font-bold transition-all ${isModalOpen ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
        >
          {isModalOpen ? <X size={15} /> : <Plus size={15} />}
          {isModalOpen ? "Close Form" : "Create Promo Code"}
        </button>
      </div>

      {isModalOpen && (
        <div className="bg-gradient-to-br from-white to-zinc-50 border border-zinc-200/60 shadow-lg rounded-2xl p-5 md:p-6 mb-6 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
              <Tag size={14} className="text-brand-600" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-sm">New Promo Code</h3>
              <p className="text-[10px] text-zinc-500">Configure discount details below</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Code Name *</label>
                <input type="text" placeholder="e.g. SUMMER25" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full text-xs font-mono font-bold tracking-wider px-3 py-2 rounded-xl border border-zinc-200 bg-white" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Discount Type</label>
                <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white">
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Discount Value *</label>
                <input type="number" placeholder={form.discountType === "PERCENT" ? "20" : "300"} value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Min Order Value (₹)</label>
                <input type="number" placeholder="0" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: e.target.value})} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Description</label>
                <input type="text" placeholder="e.g. 25% off on all whey protein" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Usage Limit</label>
                <input type="number" placeholder="e.g. 100" value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value})} className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 bg-white" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={isSubmitting} className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? "Creating..." : "Save Promo Code"}
                {!isSubmitting && <CheckCircle size={14} />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search by promo code or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input text-xs max-w-sm"
        />
      </div>

      {/* Coupons Table */}
      <div className="card overflow-hidden bg-white border border-dark-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-50 text-dark-500 font-semibold uppercase text-[10px] border-b border-dark-100">
              <tr>
                <th className="p-4">Promo Code</th>
                <th className="p-4">Description</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Min Order</th>
                <th className="p-4">Expiry</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-dark-400">
                    No promo codes found.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-dark-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Tag size={13} className="text-brand-600" />
                        <span className="font-mono font-bold text-dark-900 text-sm tracking-wide">
                          {c.code}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-dark-600 max-w-xs truncate">{c.description || "—"}</td>
                    <td className="p-4 font-bold text-dark-900">
                      {c.discountType === "PERCENT" ? `${c.discountValue}% OFF` : `${formatPrice(c.discountValue)} FLAT`}
                      {c.maxDiscount && c.discountType === "PERCENT" && (
                        <span className="block text-[10px] text-dark-400 font-normal">
                          Up to {formatPrice(c.maxDiscount)}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-dark-600 font-medium">
                      {c.minOrderValue > 0 ? formatPrice(c.minOrderValue) : "No min"}
                    </td>
                    <td className="p-4 text-dark-500 text-[11px]">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "No Expiry"}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200"
                        }`}
                      >
                        <Power size={10} />
                        {c.isActive ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(c.id, c.code)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Promo Code"
                      >
                        <Trash2 size={14} />
                      </button>
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

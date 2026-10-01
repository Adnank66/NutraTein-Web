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
          onClick={() => setIsModalOpen(true)}
          className="btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto py-2 px-4 shadow-sm"
        >
          <Plus size={15} /> Create Promo Code
        </button>
      </div>

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

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-dark-100">
              <h3 className="font-bold text-dark-900 text-base flex items-center gap-2">
                <Tag size={16} className="text-brand-600" /> Create New Promo Code
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-dark-400 hover:text-dark-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="label">Promo Code *</label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER25"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="input font-mono font-bold tracking-wider"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  placeholder="e.g. 25% off on all whey protein orders"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="input"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="label">Discount Value *</label>
                  <input
                    type="number"
                    placeholder={form.discountType === "PERCENT" ? "e.g. 20 (%)" : "e.g. 300 (₹)"}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="input"
                    required
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Min Order Value (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.minOrderValue}
                    onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                    className="input"
                    min={0}
                  />
                </div>

                <div>
                  <label className="label">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    className="input"
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Usage Limit</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="input"
                    min={1}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-dark-100">
                <h4 className="text-sm font-semibold text-dark-900 mb-2">Featured Supplement Deal (Optional)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="label">Product ID (Object ID)</label>
                    <input
                      type="text"
                      placeholder="e.g. 64a7b..."
                      value={form.productId}
                      onChange={(e) => setForm({ ...form, productId: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Product Name</label>
                    <input
                      type="text"
                      placeholder="e.g. 100% Whey Protein"
                      value={form.productName}
                      onChange={(e) => setForm({ ...form, productName: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Product Image URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://example.com/image.jpg"
                      value={form.productImage}
                      onChange={(e) => setForm({ ...form, productImage: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-dark-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-dark-800">
                  Activate immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dark-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs py-2 px-4 font-bold"
                >
                  {isSubmitting ? "Creating..." : "Save Promo Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

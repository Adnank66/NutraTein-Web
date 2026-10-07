"use client"
import { useState, useEffect } from "react"
import { Package, Plus, Trash2, Save } from "lucide-react"
import { toast } from "sonner"

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ productId: "", relatedIds: [] as string[], discountPercent: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/bundles").then(r => r.json()),
      fetch("/api/products?limit=100").then(r => r.json()),
    ]).then(([b, p]) => {
      setBundles(b.bundles || [])
      setProducts(p.products || [])
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!form.productId || form.relatedIds.length === 0) {
      return toast.error("Select a main product and at least one related product")
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Bundle saved!")
        const d = await fetch("/api/admin/bundles").then(r => r.json())
        setBundles(d.bundles || [])
        setForm({ productId: "", relatedIds: [], discountPercent: 0 })
      } else toast.error("Failed to save bundle")
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bundle?")) return
    await fetch(`/api/admin/bundles?id=${id}`, { method: "DELETE" })
    setBundles(prev => prev.filter(b => b.id !== id))
    toast.success("Bundle deleted")
  }

  const toggleRelated = (id: string) => {
    setForm(p => ({
      ...p,
      relatedIds: p.relatedIds.includes(id) ? p.relatedIds.filter(x => x !== id) : [...p.relatedIds, id]
    }))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center">
          <Package className="text-indigo-600 dark:text-indigo-400" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Frequently Bought Together</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure product bundles and bundle discounts</p>
        </div>
      </div>

      {/* Create Bundle Form */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-5">
        <h2 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 pb-3 border-b border-zinc-100 dark:border-zinc-800">Create / Update Bundle</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 mb-1">Main Product</label>
            <select value={form.productId} onChange={e => setForm(p => ({ ...p, productId: e.target.value }))}
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <option value="">Select main product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (₹{p.basePrice})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 mb-1">Bundle Discount (%)</label>
            <input type="number" min="0" max="50" value={form.discountPercent}
              onChange={e => setForm(p => ({ ...p, discountPercent: parseFloat(e.target.value) || 0 }))}
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-500 mb-2">Related Products (click to toggle)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {products.filter(p => p.id !== form.productId).map(p => (
              <div key={p.id} onClick={() => toggleRelated(p.id)}
                className={`p-2 rounded-lg border cursor-pointer text-xs transition-all ${
                  form.relatedIds.includes(p.id)
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20 font-bold text-brand-700 dark:text-brand-300'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}>
                {p.name} - ₹{p.basePrice}
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm disabled:opacity-50">
          <Save size={14} /> {saving ? "Saving..." : "Save Bundle"}
        </button>
      </div>

      {/* Existing Bundles */}
      <div className="space-y-3">
        {loading ? <p className="text-zinc-400 text-sm">Loading...</p> :
          bundles.length === 0 ? <p className="text-zinc-400 text-sm">No bundles configured yet.</p> :
          bundles.map(b => (
            <div key={b.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-bold text-sm text-zinc-900 dark:text-white">{b.product?.name || b.productId}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  With: {b.relatedProducts?.map((p: any) => p.name).join(', ') || 'N/A'}
                  {b.discountPercent > 0 && <span className="ml-2 text-emerald-600 font-semibold">({b.discountPercent}% off)</span>}
                </p>
              </div>
              <button onClick={() => handleDelete(b.id)}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition">
                <Trash2 size={14} />
              </button>
            </div>
          ))
        }
      </div>
    </div>
  )
}

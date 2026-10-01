"use client"

import { useState, useEffect } from "react"
import {
  Megaphone,
  Save,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  Check,
  RefreshCw,
  X,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const COLOR_OPTIONS = [
  { label: "Brand Red (#ff293c)", value: "bg-red-600", text: "text-white" },
  { label: "Dark Midnight (#09090b)", value: "bg-zinc-950", text: "text-white" },
  { label: "Zinc Slate (#18181b)", value: "bg-zinc-900", text: "text-white" },
  { label: "Amber Gold (#d97706)", value: "bg-amber-600", text: "text-white" },
  { label: "Emerald Green (#059669)", value: "bg-emerald-600", text: "text-white" },
  { label: "Purple Indigo (#7c3aed)", value: "bg-purple-600", text: "text-white" },
  { label: "Blue Sky (#0284c7)", value: "bg-sky-600", text: "text-white" },
]

export interface RibbonItem {
  id: string
  text: string
  badge?: string
  link?: string
  bgColor?: string
  textColor?: string
  enabled: boolean
}

export default function AdminAnnouncementsPage() {
  const [ribbons, setRibbons] = useState<RibbonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingRibbon, setEditingRibbon] = useState<RibbonItem | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const [formData, setFormData] = useState<Partial<RibbonItem>>({
    text: "",
    badge: "PROMO",
    link: "/shop",
    bgColor: "bg-red-600",
    enabled: true,
  })

  const fetchRibbons = async () => {
    try {
      const res = await fetch("/api/admin/announcement")
      const data = await res.json()
      if (data.ribbons) {
        setRibbons(data.ribbons)
      }
    } catch {
      toast.error("Failed to load ribbons")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRibbons()
  }, [])

  const handleToggle = async (id: string) => {
    const updated = ribbons.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    setRibbons(updated)
    try {
      await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ribbons: updated }),
      })
      toast.success("Ribbon status updated!")
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement ribbon?")) return
    try {
      const res = await fetch(`/api/admin/announcement?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setRibbons((prev) => prev.filter((r) => r.id !== id))
        toast.success("Ribbon deleted successfully!")
      } else {
        toast.error("Failed to delete ribbon")
      }
    } catch {
      toast.error("Error deleting ribbon")
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.text?.trim()) {
      toast.error("Announcement message is required")
      return
    }
    setSaving(true)

    try {
      const payload: RibbonItem = editingRibbon
        ? ({ ...editingRibbon, ...formData } as RibbonItem)
        : {
            id: `ribbon-${Date.now()}`,
            text: formData.text.trim(),
            badge: formData.badge?.trim() || "PROMO",
            link: formData.link?.trim() || "/shop",
            bgColor: formData.bgColor || "bg-red-600",
            enabled: formData.enabled ?? true,
          }

      const res = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ribbon: payload }),
      })

      if (res.ok) {
        toast.success(editingRibbon ? "Ribbon updated successfully!" : "New ribbon added!")
        fetchRibbons()
        setIsAdding(false)
        setEditingRibbon(null)
      } else {
        toast.error("Failed to save ribbon")
      }
    } catch {
      toast.error("Error saving ribbon")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Megaphone size={24} className="text-red-600" />
            Announcement Ribbons Control (CRUD)
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Add, edit, update, and delete promotional & authenticity ribbons displayed at the top of your website.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRibbon(null)
            setFormData({
              text: "",
              badge: "SPECIAL OFFER",
              link: "/shop",
              bgColor: "bg-red-600",
              enabled: true,
            })
            setIsAdding(true)
          }}
          className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 shadow-md"
        >
          <Plus size={15} /> Add New Ribbon
        </button>
      </div>

      {/* Live Storefront Preview */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Eye size={13} />
          Live Website Ribbon Preview (Stacked at Top of Storefront):
        </span>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm divide-y divide-white/10">
          {ribbons.filter((r) => r.enabled).length === 0 ? (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-900 text-center text-xs text-zinc-400">
              No ribbons are currently enabled. Click "Add New Ribbon" or enable one below.
            </div>
          ) : (
            ribbons
              .filter((r) => r.enabled)
              .map((r, i) => (
                <div
                  key={r.id}
                  className={`${r.bgColor || "bg-red-600"} text-white py-2 px-4 text-xs font-semibold flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {r.badge && (
                      <span className="text-[9px] font-black uppercase bg-black/25 px-2 py-0.5 rounded-md tracking-wider shrink-0">
                        {r.badge}
                      </span>
                    )}
                    <span className="truncate">{r.text}</span>
                    <span className="text-[11px] underline opacity-85 shrink-0 hidden sm:inline">
                      Link: {r.link || "/shop"} →
                    </span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60 shrink-0">Ribbon #{i + 1}</span>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Add / Edit Ribbon Modal */}
      {isAdding && (
        <div className="card p-6 bg-white dark:bg-zinc-900 border-2 border-red-500/40 rounded-3xl shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-red-500" />
              {editingRibbon ? "Edit Ribbon Announcement" : "Create New Announcement Ribbon"}
            </h3>
            <button
              onClick={() => {
                setIsAdding(false)
                setEditingRibbon(null)
              }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Quick 1-Click Templates */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Quick Template Presets (Click to Auto-Fill):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    name: "🚚 Free Shipping + FIRST10",
                    text: "FREE EXPRESS SHIPPING ON ORDERS OVER ₹999 | Use code FIRST10 for 10% off",
                    badge: "FREE SHIPPING",
                    bgColor: "bg-red-600",
                    link: "/shop",
                  },
                  {
                    name: "🚚 Free Express Delivery",
                    text: "🚚 FREE EXPRESS DELIVERY ON ALL ORDERS OVER ₹999 | DELIVERED IN 2-4 BUSINESS DAYS",
                    badge: "FREE SHIPPING",
                    bgColor: "bg-emerald-600",
                    link: "/shop",
                  },
                  {
                    name: "⚡ 20% Off Flash Sale",
                    text: "⚡ FLASH SALE: 20% OFF ALL SUPPLEMENTS | USE CODE 'PROTEIN20' | FREE EXPRESS SHIPPING",
                    badge: "LIMITED OFFER",
                    bgColor: "bg-red-600",
                    link: "/deals",
                  },
                  {
                    name: "🛡️ 100% Purity Certified",
                    text: "🛡️ 100% AUTHENTIC DIRECT LAB CERTIFIED BATCHES | ZERO AMINO SPIKING | 7-DAY REPLACEMENTS",
                    badge: "100% PURE",
                    bgColor: "bg-zinc-950",
                    link: "/about",
                  },
                ].map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        text: tpl.text,
                        badge: tpl.badge,
                        bgColor: tpl.bgColor,
                        link: tpl.link,
                      }))
                    }
                    className="text-[11px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Ribbon Message / Text *
              </label>
              <textarea
                value={formData.text || ""}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                rows={2}
                placeholder="e.g. 🚚 FREE SHIPPING OVER ₹999 | USE CODE 'NUTRA20' | 2-4 DAYS DISPATCH"
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Badge Text (Highlight Pill)
                </label>
                <input
                  type="text"
                  value={formData.badge || ""}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g. LIMITED TIME, LAB CERTIFIED, FREE SHIPPING"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Redirect Link URL
                </label>
                <input
                  type="text"
                  value={formData.link || ""}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="e.g. /shop or /about or /shop?category=whey-protein"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Ribbon Background Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => {
                  const isChosen = formData.bgColor === c.value
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, bgColor: c.value })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${c.value} ${c.text} ${
                        isChosen ? "ring-2 ring-offset-2 ring-red-500 scale-105 shadow-md" : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {isChosen && <Check size={12} className="stroke-[3]" />}
                      <span>{c.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={formData.enabled ?? true}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded border-zinc-300 text-red-600 focus:ring-red-500"
                />
                <span>Active & Visible on Website</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false)
                    setEditingRibbon(null)
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save size={14} />
                  {saving ? "Saving..." : editingRibbon ? "Update Ribbon" : "Publish Ribbon"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Ribbons List (CRUD table) */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center justify-between">
          <span>All Configured Ribbons ({ribbons.length})</span>
          <button onClick={fetchRibbons} className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 font-normal">
            <RefreshCw size={12} /> Refresh
          </button>
        </h3>

        {loading ? (
          <div className="text-center py-12 text-zinc-400">Loading announcement ribbons...</div>
        ) : ribbons.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No announcement ribbons configured.</p>
            <p className="text-xs text-zinc-400 mt-1">Click the button above to add your first ribbon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ribbons.map((ribbon, idx) => (
              <div
                key={ribbon.id}
                className="card p-4 sm:p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">
                      #{idx + 1}
                    </span>
                    {ribbon.badge && (
                      <span className="text-[9px] font-black uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded">
                        {ribbon.badge}
                      </span>
                    )}
                    <span
                      className={`w-3 h-3 rounded-full ${ribbon.bgColor || "bg-red-600"} border border-white/20`}
                      title="Background color"
                    />
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ribbon.enabled
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {ribbon.enabled ? "Active on Website" : "Disabled / Hidden"}
                    </span>
                  </div>

                  <p className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-snug">
                    {ribbon.text}
                  </p>

                  <p className="text-[11px] text-zinc-400">
                    Target Link: <strong className="text-zinc-600 dark:text-zinc-300">{ribbon.link || "/shop"}</strong>
                  </p>
                </div>

                {/* Ribbon Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => handleToggle(ribbon.id)}
                    className={`text-xs font-bold py-1.5 px-3 rounded-xl border transition-all ${
                      ribbon.enabled
                        ? "border-emerald-200 dark:border-emerald-800 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    {ribbon.enabled ? "Active" : "Enable"}
                  </button>

                  <button
                    onClick={() => {
                      setEditingRibbon(ribbon)
                      setFormData(ribbon)
                      setIsAdding(true)
                    }}
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Edit ribbon"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    onClick={() => handleDelete(ribbon.id)}
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete ribbon"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

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
  Check,
  RefreshCw,
  X,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Zap,
  Send,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"

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

interface FeatureItem {
  id: string
  icon: string
  title: string
  desc: string
  enabled: boolean
}

const DEFAULT_FEATURES: FeatureItem[] = [
  { id: "f1", icon: "🧪", title: "100% Lab Tested", desc: "Every batch third-party certified", enabled: true },
  { id: "f2", icon: "🚚", title: "Free Express Shipping", desc: "On orders above ₹999", enabled: true },
  { id: "f3", icon: "🔄", title: "7-Day Returns", desc: "Hassle-free replacement guarantee", enabled: true },
  { id: "f4", icon: "🛡️", title: "FSSAI Certified", desc: "Indian food safety compliant", enabled: true },
]

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

  // Features state
  const [features, setFeatures] = useState<FeatureItem[]>([])
  const [featuresLoading, setFeaturesLoading] = useState(true)
  const [featuresSaving, setFeaturesSaving] = useState(false)

  // Broadcast Notification State
  const [broadcastChannel, setBroadcastChannel] = useState<"EMAIL" | "WHATSAPP" | "BOTH">("BOTH")
  const [broadcastTitle, setBroadcastTitle] = useState("⚡ New Store Offer & Update")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [broadcastEmail, setBroadcastEmail] = useState("")
  const [broadcastPhone, setBroadcastPhone] = useState("")
  const [sendingBroadcast, setSendingBroadcast] = useState(false)

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      return toast.error("Please enter a message to broadcast")
    }
    setSendingBroadcast(true)
    try {
      const res = await fetch("/api/admin/announcement/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          channel: broadcastChannel,
          recipientEmail: broadcastEmail,
          recipientPhone: broadcastPhone,
        }),
      })
      const d = await res.json()
      if (d.success) {
        toast.success(d.message || "Broadcast update sent successfully!")
        setBroadcastMessage("")
      } else {
        toast.error(d.error || "Failed to send broadcast")
      }
    } catch {
      toast.error("Failed to send broadcast notification")
    } finally {
      setSendingBroadcast(false)
    }
  }

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

  const fetchFeatures = async () => {
    try {
      const res = await fetch("/api/admin/features")
      const data = await res.json()
      if (data.features) setFeatures(data.features)
      else setFeatures(DEFAULT_FEATURES)
    } catch {
      setFeatures(DEFAULT_FEATURES)
    } finally {
      setFeaturesLoading(false)
    }
  }

  useEffect(() => {
    fetchRibbons()
    fetchFeatures()
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
      const ribbon = updated.find((r) => r.id === id)
      toast.success(`Ribbon ${ribbon?.enabled ? "activated" : "deactivated"} on website!`)
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

  // Features handlers
  const handleFeatureChange = (id: string, field: keyof FeatureItem, value: string | boolean) => {
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)))
  }

  const handleAddFeature = () => {
    const newFeature: FeatureItem = {
      id: `f-${Date.now()}`,
      icon: "⭐",
      title: "New Feature",
      desc: "Description here",
      enabled: true,
    }
    setFeatures((prev) => [...prev, newFeature])
  }

  const handleDeleteFeature = (id: string) => {
    setFeatures((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSaveFeatures = async () => {
    setFeaturesSaving(true)
    try {
      const res = await fetch("/api/admin/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      })
      if (res.ok) toast.success("Features saved successfully!")
      else toast.error("Failed to save features")
    } catch {
      toast.error("Error saving features")
    } finally {
      setFeaturesSaving(false)
    }
  }

  return (
    <div className="space-y-10 max-w-5xl">
      {/* ── SECTION 1: Ribbon Announcements ── */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <Megaphone size={24} className="text-red-600" />
              Announcement Ribbons Control
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Toggle ON/OFF, add, edit, or delete promotional ribbons displayed at the top of your website.
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

        {/* Live Preview */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Eye size={13} />
            Live Website Ribbon Preview (Stacked at Top of Storefront):
          </span>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm divide-y divide-white/10">
            {ribbons.filter((r) => r.enabled).length === 0 ? (
              <div className="p-4 bg-zinc-100 dark:bg-zinc-900 text-center text-xs text-zinc-400">
                No ribbons are currently enabled. Toggle ON a ribbon below.
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

        {/* Add / Edit Form */}
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
              {/* Quick Templates */}
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
                    {
                      name: "🆕 New Launch",
                      text: "NEW LAUNCH | NITROTEIN WHEY ISOLATE NOW AVAILABLE | Shop Now",
                      badge: "NEW",
                      bgColor: "bg-amber-600",
                      link: "/shop",
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
                    placeholder="e.g. /shop or /about"
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
                  <span>Active &amp; Visible on Website</span>
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

        {/* Ribbons List with Big ON/OFF Toggles */}
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
                  className={`card p-4 sm:p-5 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    ribbon.enabled
                      ? "border-emerald-300 dark:border-emerald-800"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {/* Color stripe accent */}
                  <div className={`w-1 self-stretch rounded-full shrink-0 hidden sm:block ${ribbon.bgColor || "bg-red-600"}`} />

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
                    </div>

                    <p className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-snug">
                      {ribbon.text}
                    </p>

                    <p className="text-[11px] text-zinc-400">
                      Target Link: <strong className="text-zinc-600 dark:text-zinc-300">{ribbon.link || "/shop"}</strong>
                    </p>
                  </div>

                  {/* Big ON/OFF Toggle + Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                    {/* BIG Toggle Button */}
                    <button
                      onClick={() => handleToggle(ribbon.id)}
                      className={`flex items-center gap-2 py-2.5 px-5 rounded-2xl font-black text-sm transition-all shadow-sm border-2 ${
                        ribbon.enabled
                          ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-400 text-white shadow-emerald-200 dark:shadow-emerald-900"
                          : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
                      }`}
                      title={ribbon.enabled ? "Click to disable ribbon" : "Click to enable ribbon"}
                    >
                      {ribbon.enabled ? (
                        <>
                          <ToggleRight size={20} />
                          ON
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={20} />
                          OFF
                        </>
                      )}
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

      {/* ── SECTION 2: Features / Alerts Editor ── */}
      <div className="space-y-5 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={22} className="text-emerald-600" />
              Homepage Feature Badges
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Edit the trust/feature badges shown on the homepage (e.g. Lab Tested, Free Shipping, Money-Back Guarantee).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddFeature}
              className="text-xs py-2 px-4 flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold transition-colors"
            >
              <Plus size={14} /> Add Feature
            </button>
            <button
              onClick={handleSaveFeatures}
              disabled={featuresSaving}
              className="text-xs py-2 px-4 flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {featuresSaving ? "Saving..." : "Save Features"}
            </button>
          </div>
        </div>

        {featuresLoading ? (
          <div className="text-center py-10 text-zinc-400 text-sm">Loading features...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.id}
                className={`card p-4 bg-white dark:bg-zinc-900 rounded-2xl border transition-all space-y-3 ${
                  feature.enabled
                    ? "border-emerald-200 dark:border-emerald-800"
                    : "border-zinc-200 dark:border-zinc-800 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{feature.icon}</span>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">
                      {feature.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Feature ON/OFF toggle */}
                    <button
                      onClick={() => handleFeatureChange(feature.id, "enabled", !feature.enabled)}
                      className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl font-black text-xs transition-all border ${
                        feature.enabled
                          ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-400 text-white"
                          : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {feature.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {feature.enabled ? "ON" : "OFF"}
                    </button>
                    <button
                      onClick={() => handleDeleteFeature(feature.id)}
                      className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="w-16">
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Icon</label>
                      <input
                        type="text"
                        value={feature.icon}
                        onChange={(e) => handleFeatureChange(feature.id, "icon", e.target.value)}
                        className="w-full text-center text-base px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                        maxLength={4}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Title</label>
                      <input
                        type="text"
                        value={feature.title}
                        onChange={(e) => handleFeatureChange(feature.id, "title", e.target.value)}
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Description</label>
                    <input
                      type="text"
                      value={feature.desc}
                      onChange={(e) => handleFeatureChange(feature.id, "desc", e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {features.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleSaveFeatures}
              disabled={featuresSaving}
              className="text-sm py-2.5 px-6 flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md disabled:opacity-50 transition-colors"
            >
              <Save size={15} />
              {featuresSaving ? "Saving..." : "Save All Features"}
            </button>
          </div>
        )}
      </div>

      {/* Broadcast Updates to Email / WhatsApp */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Send size={18} className="text-brand-600" />
              Broadcast Store Update / Offer (Email & WhatsApp)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Send an instant update or flash promo alert directly to customers or a test contact.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["BOTH", "EMAIL", "WHATSAPP"] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setBroadcastChannel(ch)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  broadcastChannel === ch
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {ch === "BOTH" ? "Both (Email + WhatsApp)" : ch === "EMAIL" ? "📧 Email Only" : "💬 WhatsApp Only"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Broadcast Title / Heading
            </label>
            <input
              type="text"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="e.g. FLASH SALE: 20% OFF ALL SUPPLEMENTS"
              className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Test Recipient Email (Optional)
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={broadcastEmail}
                onChange={(e) => setBroadcastEmail(e.target.value)}
                placeholder="Leave blank to send to store subscribers"
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Update Message Body *
            </label>
            <textarea
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Enter announcement text: e.g. Hey Athletes! New batch of NitroTein Isolate is now live. Use code PROTEIN20 at checkout for 20% off today only!"
              className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Test Recipient WhatsApp Number (Optional)
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={broadcastPhone}
                onChange={(e) => setBroadcastPhone(e.target.value)}
                placeholder="+91 9321598094"
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={sendingBroadcast || !broadcastMessage.trim()}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md disabled:opacity-50 transition-all"
            >
              <Send size={14} />
              {sendingBroadcast ? "Sending Broadcast..." : "Send Update Message"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

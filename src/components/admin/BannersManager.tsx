"use client"

import { useState, useEffect } from "react"
import {
  Image as ImageIcon,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
  Maximize2,
  Check,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface BannerItem {
  id: string
  title: string
  subtitle: string
  badgeText: string
  ctaText: string
  ctaLink: string
  imageUrl: string
  objectFit?: "contain" | "cover"
  isActive: boolean
  sortOrder: number
}

export default function BannersManager() {
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [activeBannerId, setActiveBannerId] = useState<string>("ban-whey")
  const [fitMode, setFitMode] = useState<"contain" | "cover">("cover")
  const [bannerWidth, setBannerWidth] = useState<string>("1600")
  const [bannerHeight, setBannerHeight] = useState<string>("xl")
  const [loading, setLoading] = useState(true)
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/admin/banners")
      const data = await res.json()
      if (data.banners) {
        setBanners(data.banners)
        setActiveBannerId(data.activeBannerId || data.banners[0]?.id || "")
        setFitMode(data.fitMode || "cover")
        if (data.bannerWidth) setBannerWidth(data.bannerWidth)
        if (data.bannerHeight) setBannerHeight(data.bannerHeight)
      }
    } catch {
      toast.error("Failed to load banners")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const handleSetStorefrontActive = async (id: string) => {
    setActiveBannerId(id)
    try {
      await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeBannerId: id }),
      })
      toast.success("Set as primary storefront hero banner!")
    } catch {
      toast.error("Failed to update active banner")
    }
  }

  const handleUpdateFitMode = async (mode: "contain" | "cover") => {
    setFitMode(mode)
    try {
      await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fitMode: mode }),
      })
      toast.success(`Banner display fit updated to ${mode.toUpperCase()}!`)
    } catch {
      toast.error("Failed to update fit mode")
    }
  }

  const handleUpdateBannerWidth = async (width: string) => {
    setBannerWidth(width)
    try {
      await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerWidth: width }),
      })
      toast.success(`Banner width updated to ${width === "full" ? "100vw Full" : width + "px"}!`)
    } catch {
      toast.error("Failed to update banner width")
    }
  }

  const handleUpdateBannerHeight = async (height: string) => {
    setBannerHeight(height)
    try {
      await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bannerHeight: height }),
      })
      toast.success(`Banner display height updated to ${height.toUpperCase()}!`)
    } catch {
      toast.error("Failed to update banner height")
    }
  }

  const handleToggleActive = async (id: string) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    setBanners(updated)
    try {
      await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners: updated }),
      })
      toast.success("Banner visibility status updated!")
    } catch {
      toast.error("Failed to update banner status")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this banner image?")) return
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id))
        toast.success("Banner removed successfully!")
      } else {
        toast.error("Failed to delete banner")
      }
    } catch {
      toast.error("Failed to delete banner")
    }
  }

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBanner) return
    setSaving(true)

    try {
      const entry = isNew
        ? { ...editingBanner, id: `ban-${Date.now()}` }
        : editingBanner

      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banner: entry }),
      })

      if (res.ok) {
        toast.success(isNew ? "New banner created!" : "Banner changes saved!")
        fetchBanners()
        setEditingBanner(null)
        setIsNew(false)
      } else {
        toast.error("Failed to save banner")
      }
    } catch {
      toast.error("Failed to save banner")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <ImageIcon size={24} className="text-red-600" />
            Storefront Hero Banners & Graphics CMS
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Store, manage, and fit/fill current and archived banner graphics across the storefront.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Fit & Fill Mode Selector */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
            <span className="text-[10px] text-zinc-400 px-2 uppercase">Fit & Fill:</span>
            <button
              onClick={() => handleUpdateFitMode("contain")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fitMode === "contain"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
              title="Show entire banner image without cropping (Fit properly)"
            >
              Fit (Contain)
            </button>
            <button
              onClick={() => handleUpdateFitMode("cover")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fitMode === "cover"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
              title="Fill entire banner container edge-to-edge (Fill properly)"
            >
              Fill (Cover)
            </button>
          </div>

          <button
            onClick={() => {
              setEditingBanner({
                id: "",
                title: "",
                subtitle: "",
                badgeText: "SPECIAL LAUNCH",
                ctaText: "Shop Collection",
                ctaLink: "/shop",
                imageUrl: "/assets/banners/whey-red-banner.png",
                objectFit: fitMode,
                isActive: true,
                sortOrder: banners.length + 1,
              })
              setIsNew(true)
            }}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700"
          >
            <Plus size={15} /> Add New Banner
          </button>
        </div>
      </div>

      {/* Banner Screen Size & Layout Controls Card */}
      <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Maximize2 size={18} className="text-red-600" />
            <span className="font-bold text-sm text-zinc-900 dark:text-white">
              Hero Banner Screen Sizing & Fitting Controls
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Real-time manual controls for banner screen width, height, and edge-to-edge image fitting.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Banner Width Controller */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Banner Width (Screen Presence)</span>
              <span className="font-mono text-[10px] text-red-600 dark:text-red-400 font-bold">
                {bannerWidth === "full" ? "100vw Full" : bannerWidth + "px"}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
              {[
                { id: "full", label: "Full" },
                { id: "1600", label: "1600" },
                { id: "1400", label: "1400" },
                { id: "1200", label: "1200" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleUpdateBannerWidth(opt.id)}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    bannerWidth === opt.id
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-black"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-400">
              {bannerWidth === "full"
                ? "Expands to maximum display width (1920px)."
                : bannerWidth === "1600"
                ? "Ultra-wide 1640px hero frame for modern monitors."
                : bannerWidth === "1400"
                ? "Balanced 1440px wide layout."
                : "Compact 1200px boxed frame."}
            </p>
          </div>

          {/* Banner Height Controller */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Banner Height Scale</span>
              <span className="font-mono text-[10px] text-red-600 dark:text-red-400 font-bold">
                {bannerHeight === "xl" ? "XL (720px)" : bannerHeight === "lg" ? "LG (640px)" : "MD (520px)"}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
              {[
                { id: "xl", label: "XL (720px)" },
                { id: "lg", label: "LG (640px)" },
                { id: "md", label: "MD (520px)" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleUpdateBannerHeight(opt.id)}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    bannerHeight === opt.id
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-black"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-400">
              {bannerHeight === "xl"
                ? "Extra large height — highly prominent on desktop."
                : bannerHeight === "lg"
                ? "Standard prominent height."
                : "Medium compact height."}
            </p>
          </div>

          {/* Fit & Fill Mode Controller */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Global Image Fit & Fill</span>
              <span className="font-mono text-[10px] text-red-600 dark:text-red-400 font-bold">
                {fitMode.toUpperCase()}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => handleUpdateFitMode("cover")}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  fitMode === "cover"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-black"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
                title="Fill container edge-to-edge with zero side gaps"
              >
                Fill (Cover)
              </button>
              <button
                type="button"
                onClick={() => handleUpdateFitMode("contain")}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  fitMode === "contain"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-black"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
                title="Fit entire banner without cropping"
              >
                Fit (Contain)
              </button>
            </div>
            <p className="text-[10px] text-zinc-400">
              {fitMode === "cover"
                ? "Fills banner completely with zero side gaps."
                : "Shows full image artwork inside container."}
            </p>
          </div>
        </div>
      </div>

      {/* Edit / Create Modal Form */}
      {editingBanner && (
        <div className="card p-6 bg-white dark:bg-zinc-900 border-2 border-red-500/50 shadow-2xl rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <Sparkles size={16} className="text-red-500" />
            {isNew ? "Create Storefront Hero Banner" : "Edit Banner Configuration"}
          </h3>

          <form onSubmit={handleSaveBanner} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Headline Title
              </label>
              <input
                type="text"
                value={editingBanner.title}
                onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Subtitle / Benefit Copy
              </label>
              <input
                type="text"
                value={editingBanner.subtitle}
                onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Badge / Tag Text
              </label>
              <input
                type="text"
                value={editingBanner.badgeText}
                onChange={(e) => setEditingBanner({ ...editingBanner, badgeText: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Banner Image URL / File Path
              </label>
              <input
                type="text"
                value={editingBanner.imageUrl}
                onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="e.g. /assets/banners/whey-red-banner.png"
                required
              />
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                Recommended: 16:9 widescreen format (e.g. 2752×1536px or 1920×1080px). Auto-fills edge-to-edge with zero side gaps.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                value={editingBanner.ctaText}
                onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                CTA Button Link
              </label>
              <input
                type="text"
                value={editingBanner.ctaLink}
                onChange={(e) => setEditingBanner({ ...editingBanner, ctaLink: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Individual Image Fit Mode
              </label>
              <select
                value={editingBanner.objectFit || fitMode}
                onChange={(e) => setEditingBanner({ ...editingBanner, objectFit: e.target.value as any })}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              >
                <option value="cover">Fill (Cover - Fills edge-to-edge, zero side gaps)</option>
                <option value="contain">Fit (Contain - Shows full image without cropping)</option>
              </select>
              <p className="text-[10px] text-zinc-400 mt-1">
                Overrides global fit mode for this specific banner image.
              </p>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md disabled:opacity-50"
              >
                {saving ? "Saving..." : isNew ? "Create & Save" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners Grid */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading stored banner images...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => {
            const isStorefrontActive = activeBannerId === banner.id
            const itemFit = banner.objectFit || fitMode

            return (
              <div
                key={banner.id}
                className={`card bg-white dark:bg-zinc-900 border rounded-3xl overflow-hidden transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                  isStorefrontActive
                    ? "border-red-500 ring-2 ring-red-500/20"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div>
                  {/* Banner Image Preview with Fit & Fill Rendering */}
                  <div className="relative h-44 w-full bg-zinc-950 flex items-center justify-center overflow-hidden group">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className={`w-full h-full transition-transform duration-700 group-hover:scale-105 ${
                        itemFit === "cover" ? "object-cover" : "object-contain p-2"
                      }`}
                    />

                    {/* Active Storefront Pill */}
                    {isStorefrontActive && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10">
                        <Check size={10} /> Active Storefront Hero
                      </span>
                    )}

                    <span className="absolute top-3 right-3 bg-black/60 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-sm z-10">
                      {itemFit.toUpperCase()}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                        {banner.badgeText || "BANNER GRAPHIC"}
                      </span>
                      <button 
                        onClick={() => handleToggleActive(banner.id)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                          banner.isActive
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                        title={banner.isActive ? "Click to deactivate" : "Click to activate"}
                      >
                        {banner.isActive ? "Published" : "Draft (Inactive)"}
                      </button>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">
                      {banner.title}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {banner.subtitle}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono truncate">
                      File: {banner.imageUrl}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                  {!isStorefrontActive ? (
                    <button
                      onClick={() => handleSetStorefrontActive(banner.id)}
                      className="text-xs font-bold py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-red-500 hover:text-red-600 transition-all flex items-center gap-1"
                    >
                      <span>Set as Hero</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Active Hero
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(banner.id)}
                      className={`p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors ${
                        banner.isActive
                          ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                      title={banner.isActive ? "Deactivate banner" : "Activate banner"}
                    >
                      {banner.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingBanner(banner)
                        setIsNew(false)
                      }}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="Edit banner text and graphic"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete banner"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

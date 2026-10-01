"use client"

import { useState, useRef, useEffect } from "react"
import {
  Image as ImageIcon,
  Copy,
  Check,
  Search,
  UploadCloud,
  Trash2,
  Edit2,
  ExternalLink,
  X,
  Save,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"

export interface MediaAsset {
  id: string
  name: string
  url: string
  category: "Products" | "Banners" | "Icons" | "Uploaded"
  size: string
  dimensions: string
}

const DEFAULT_ASSETS: MediaAsset[] = [
  { id: "m1", name: "Nitro-Tein Whey Isolate Poster", url: "/assets/products/whey.jpg", category: "Products", size: "320 KB", dimensions: "1200×1200" },
  { id: "m2", name: "Titan Pump Pre-Workout High Def", url: "/assets/products/pre-workout.jpg", category: "Products", size: "280 KB", dimensions: "1200×1200" },
  { id: "m3", name: "CreaCore Micronized Creatine 100g", url: "/assets/products/creatine.jpg", category: "Products", size: "210 KB", dimensions: "1200×1200" },
  { id: "m4", name: "Mass Surge Extreme Gainer Tub", url: "/assets/products/mass-gainer.jpg", category: "Products", size: "350 KB", dimensions: "1200×1200" },
  { id: "m5", name: "Clean Plant-Based Vegan Protein", url: "/assets/products/plant-protein.jpg", category: "Products", size: "190 KB", dimensions: "1200×1200" },
  { id: "m6", name: "Multi-Vitamin Sport Minerals", url: "/assets/products/vitamins.jpg", category: "Products", size: "180 KB", dimensions: "1200×1200" },
  { id: "m7", name: "L-Carnitine 3300mg Triple Strength", url: "/assets/products/l-carnitine.jpg", category: "Products", size: "220 KB", dimensions: "1200×1200" },
  { id: "m8", name: "BCAA Rapid Amino Recovery", url: "/assets/products/bcaa.jpg", category: "Products", size: "240 KB", dimensions: "1200×1200" },
  { id: "m9", name: "Hero Carousel Nitro-Tein Promo", url: "/assets/banners/hero-whey.jpg", category: "Banners", size: "640 KB", dimensions: "1920×800" },
  { id: "m10", name: "Creatine Strength Banner", url: "/assets/banners/creatine-banner.jpg", category: "Banners", size: "520 KB", dimensions: "1920×800" },
  { id: "m11", name: "UPI Scanner Official QR Graphic", url: "/assets/payment/upi-qr.svg", category: "Icons", size: "140 KB", dimensions: "800×800" },
]

const CAT_COLORS: Record<string, string> = {
  Products: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Banners: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Icons: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Uploaded: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
}

export default function MediaManager() {
  const [assets, setAssets] = useState<MediaAsset[]>(DEFAULT_ASSETS)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCat, setSelectedCat] = useState("ALL")
  const [uploading, setUploading] = useState(false)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null)
  const [previewError, setPreviewError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load saved assets from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nutratein_media_assets")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAssets(parsed)
        }
      }
    } catch {
      // fallback to DEFAULT_ASSETS
    }
  }, [])

  const persistAssets = (newAssets: MediaAsset[]) => {
    setAssets(newAssets)
    try {
      localStorage.setItem("nutratein_media_assets", JSON.stringify(newAssets))
    } catch {}
  }

  const copyUrl = (id: string, url: string) => {
    const fullUrl = url.startsWith("http") ? url : window.location.origin + url
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(id)
    toast.success("Asset URL copied to clipboard!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const deleteAsset = (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from the library?`)) return
    const updated = assets.filter(a => a.id !== id)
    persistAssets(updated)
    toast.success(`"${name}" removed from library.`)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      const newAsset: MediaAsset = {
        id: "u" + Date.now(),
        name: file.name.replace(/\.[^.]+$/, ""),
        url: data.url,
        category: "Uploaded",
        size: (file.size / 1024).toFixed(0) + " KB",
        dimensions: "Auto-detect",
      }
      const updated = [newAsset, ...assets]
      persistAssets(updated)
      toast.success("Asset uploaded successfully!")
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const startEdit = (asset: MediaAsset) => {
    setEditingAsset({ ...asset })
    setPreviewError(false)
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAsset) return
    if (!editingAsset.url.trim()) {
      toast.error("Image URL / path cannot be empty")
      return
    }

    const updated = assets.map(a => a.id === editingAsset.id ? editingAsset : a)
    persistAssets(updated)
    // Clear error for this asset ID so the new image loads
    setImgErrors(prev => {
      const next = { ...prev }
      delete next[editingAsset.id]
      return next
    })
    setEditingAsset(null)
    toast.success(`Updated "${editingAsset.name}"`)
  }

  const resetToDefaults = () => {
    if (!confirm("Reset media library to default assets?")) return
    persistAssets(DEFAULT_ASSETS)
    setImgErrors({})
    toast.success("Media library reset to default assets")
  }

  const categories = ["ALL", "Products", "Banners", "Icons", "Uploaded"]
  const filtered = assets.filter(a => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.url.toLowerCase().includes(search.toLowerCase())
    const matchCat = selectedCat === "ALL" || a.category === selectedCat
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <ImageIcon size={24} className="text-brand-600" />
            Media Assets Library
            <span className="text-sm font-normal text-zinc-400">({assets.length} files)</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Upload, edit card URLs/paths, copy links, and manage product photos, banners, and icons.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={resetToDefaults}
            type="button"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-xl transition-colors"
            title="Reset to default library"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 shadow-sm"
          >
            <UploadCloud size={16} />
            {uploading ? "Uploading…" : "Upload New Asset"}
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="card p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search assets by name or path…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all ${
                selectedCat === cat
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <ImageIcon size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No assets found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(asset => (
            <div
              key={asset.id}
              className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
            >
              {/* Image Thumbnail */}
              <div className="relative w-full aspect-square bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
                {imgErrors[asset.id] ? (
                  <div className="flex flex-col items-center gap-1 text-zinc-400 p-4">
                    <ImageIcon size={28} className="opacity-40" />
                    <span className="text-[10px] text-center">Image not found</span>
                    <button
                      type="button"
                      onClick={() => startEdit(asset)}
                      className="text-[10px] text-brand-600 dark:text-brand-400 font-bold hover:underline mt-1"
                    >
                      Fix Image URL
                    </button>
                  </div>
                ) : (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={() => setImgErrors(prev => ({ ...prev, [asset.id]: true }))}
                  />
                )}

                {/* Category Badge */}
                <span className={`absolute top-2 left-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${CAT_COLORS[asset.category] || "bg-zinc-200 text-zinc-700"}`}>
                  {asset.category}
                </span>

                {/* Hover Action Buttons: Edit & Delete */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(asset)}
                    className="p-1.5 bg-zinc-900/90 hover:bg-black text-white rounded-lg shadow-md transition-colors"
                    title="Edit image card path & details"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => deleteAsset(asset.id, asset.name)}
                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md transition-colors"
                    title="Delete asset"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 flex-1 space-y-1">
                <p className="font-bold text-xs text-zinc-900 dark:text-white truncate" title={asset.name}>
                  {asset.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{asset.dimensions}</span>
                  <span>{asset.size}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-3 pb-3 flex items-center gap-2">
                <span className="font-mono text-[10px] text-zinc-400 truncate flex-1" title={asset.url}>
                  {asset.url}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(asset)}
                  className="shrink-0 flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  title="Edit image URL"
                >
                  <Edit2 size={11} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyUrl(asset.id, asset.url)}
                  className={`shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    copiedId === asset.id
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-400"
                  }`}
                  title="Copy URL"
                >
                  {copiedId === asset.id ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Card Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                    Edit Image Card
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Change image path, URL, name, or category
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Preview Box */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-950/60 flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                {previewError || !editingAsset.url ? (
                  <div className="text-center p-2 text-zinc-400">
                    <ImageIcon size={20} className="mx-auto opacity-50" />
                    <span className="text-[9px] block mt-0.5">Not found</span>
                  </div>
                ) : (
                  <img
                    src={editingAsset.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewError(true)}
                    onLoad={() => setPreviewError(false)}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Live Preview</span>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {editingAsset.name || "Untitled"}
                </p>
                <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                  {editingAsset.url || "No URL specified"}
                </p>
                {previewError && (
                  <p className="text-[10px] text-rose-500 font-semibold">
                    ⚠️ The URL above did not load. Check path spelling or extension.
                  </p>
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Image Path / URL *
                </label>
                <input
                  type="text"
                  value={editingAsset.url}
                  onChange={(e) => {
                    setEditingAsset({ ...editingAsset, url: e.target.value })
                    setPreviewError(false)
                  }}
                  placeholder="/assets/products/your-image.jpg or https://..."
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  You can enter a local path (e.g. <code className="text-brand-500">/assets/products/whey.jpg</code>) or an external image link.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Card Title / Name *
                </label>
                <input
                  type="text"
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  placeholder="e.g. Nitro-Tein Whey Isolate Poster"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editingAsset.category}
                    onChange={(e) => setEditingAsset({ ...editingAsset, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500"
                  >
                    <option value="Products">Products</option>
                    <option value="Banners">Banners</option>
                    <option value="Icons">Icons</option>
                    <option value="Uploaded">Uploaded</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Dimensions (Label)
                  </label>
                  <input
                    type="text"
                    value={editingAsset.dimensions}
                    onChange={(e) => setEditingAsset({ ...editingAsset, dimensions: e.target.value })}
                    placeholder="e.g. 1200×1200"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 shadow-sm"
                >
                  <Save size={13} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

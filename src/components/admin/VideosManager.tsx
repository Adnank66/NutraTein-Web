"use client"

import { useState, useEffect } from "react"
import {
  Video,
  Plus,
  Play,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Film,
  X,
  RefreshCw,
  Save,
  Check,
  Upload,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"

export interface VideoItem {
  id: string
  title: string
  tagline?: string
  kicker?: string
  creator: string
  videoUrl: string
  poster?: string
  productId?: string
  productSlug?: string
  productName?: string
  productImage?: string
  badge?: string
  badgeVariant?: "red" | "gold"
  price?: number
  mrp?: number
  servings?: string
  isTopSeller?: boolean
  isActive: boolean
  objectFit?: "cover" | "contain"
}

export default function VideosManager() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null)
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [galleryTarget, setGalleryTarget] = useState<"videoUrl" | "productImage" | null>(null)
  const [galleryAssets, setGalleryAssets] = useState<any[]>([])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "videoUrl" | "productImage") => {
    const file = e.target.files?.[0]
    if (!file) return
    const fData = new FormData()
    fData.append("file", file)
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFormData((prev) => ({
        ...prev,
        [field]: data.url,
        ...(field === "productImage" ? { poster: data.url } : {}),
      }))
      toast.success(`${field === "videoUrl" ? "Video" : "Image"} uploaded successfully!`)
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    }
  }

  const openGallery = (target: "videoUrl" | "productImage") => {
    try {
      const saved = localStorage.getItem("nutratein_media_assets")
      if (saved) {
        setGalleryAssets(JSON.parse(saved))
      }
    } catch {}
    setGalleryTarget(target)
  }

  // Quick inline title editing state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null)
  const [inlineTitle, setInlineTitle] = useState("")

  const [formData, setFormData] = useState<Partial<VideoItem>>({
    title: "",
    tagline: "Engineered for explosive workout performance and rapid gains.",
    kicker: "TOP SELLER 4K",
    creator: "Official Campaign",
    videoUrl: "/assets/video/pre-ani-4k.mp4",
    poster: "/assets/recommendations/titan.jpg",
    productName: "Titan Loaded Pre-Workout",
    productSlug: "ignition-pre-workout",
    productImage: "/assets/recommendations/titan.jpg",
    badge: "PUMP & FOCUS",
    badgeVariant: "red",
    price: 2999,
    mrp: 3699,
    servings: "30 Servings",
    isTopSeller: true,
    isActive: true,
    objectFit: "cover",
  })

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/admin/videos")
      const data = await res.json()
      if (data.videos) {
        setVideos(data.videos)
      }
    } catch {
      toast.error("Failed to load videos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const handleToggle = async (id: string) => {
    const updated = videos.map((v) => (v.id === id ? { ...v, isActive: !v.isActive } : v))
    setVideos(updated)
    try {
      await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videos: updated }),
      })
      toast.success("Video publication status updated!")
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this video from the storefront?")) return
    try {
      const res = await fetch(`/api/admin/videos?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== id))
        toast.success("Video removed successfully!")
      } else {
        toast.error("Failed to remove video")
      }
    } catch {
      toast.error("Failed to delete video")
    }
  }

  const handleInlineSave = async (id: string) => {
    if (!inlineTitle.trim()) {
      toast.error("Video name cannot be empty")
      return
    }
    const updated = videos.map((v) => (v.id === id ? { ...v, title: inlineTitle.trim() } : v))
    setVideos(updated)
    setInlineEditingId(null)

    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video: { id, title: inlineTitle.trim() },
        }),
      })
      if (res.ok) {
        toast.success("Video name updated!")
        fetchVideos()
      } else {
        toast.error("Failed to update video name")
      }
    } catch {
      toast.error("Error saving video name")
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title?.trim() || !formData.videoUrl?.trim()) {
      toast.error("Video Name and Video URL are required")
      return
    }
    setSaving(true)

    try {
      let cleanUrl = (formData.videoUrl || "").trim()
      if (!cleanUrl.toLowerCase().endsWith(".mp4")) {
        const lower = cleanUrl.toLowerCase()
        if (lower.includes("pre")) cleanUrl = "/assets/video/pre-ani-4k.mp4"
        else if (lower.includes("nitro")) cleanUrl = "/assets/video/shreded-ani-4k.mp4"
        else cleanUrl = "/assets/video/shredtein-ani-video.mp4"
      }

      const payload = editingVideo
        ? { ...editingVideo, ...formData, videoUrl: cleanUrl }
        : {
            ...formData,
            videoUrl: cleanUrl,
            id: `vid-${Date.now()}`,
            productImage: formData.productImage || formData.poster || "/assets/top-sellers/nitrotein-performance-whey.png",
          }

      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video: payload }),
      })

      if (res.ok) {
        toast.success(editingVideo ? "Video details updated!" : "New video added to Top Sellers!")
        fetchVideos()
        setIsAdding(false)
        setEditingVideo(null)
      } else {
        toast.error("Failed to save video")
      }
    } catch {
      toast.error("Failed to save video")
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
            <Film size={24} className="text-red-600" />
            Top Seller & Influencer 4K Video CMS
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Full control to edit video names, video URLs, and associated product cards displayed on the storefront.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingVideo(null)
            setFormData({
              title: "",
              tagline: "Fuel the work with authentic nutrition formulas.",
              kicker: "INFLUENCER REEL",
              creator: "Athlete Partner",
              videoUrl: "/assets/video/pre-ani-4k.mp4",
              poster: "/assets/recommendations/titan.jpg",
              productName: "Titan Loaded Pre-Workout",
              productSlug: "ignition-pre-workout",
              productImage: "/assets/recommendations/titan.jpg",
              badge: "TOP SELLER",
              badgeVariant: "red",
              price: 2999,
              mrp: 3699,
              servings: "30 Servings",
              isTopSeller: true,
              isActive: true,
              objectFit: "cover",
            })
            setIsAdding(true)
          }}
          className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 shadow-md"
        >
          <Plus size={15} /> Add Video Manually (Full Details)
        </button>
      </div>

      {/* Add / Edit Form Modal */}
      {isAdding && (
        <div className="card p-4 sm:p-6 bg-white dark:bg-zinc-900 border-2 border-red-500/40 rounded-3xl shadow-xl space-y-4 animate-fade-in max-w-full overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-red-500" />
              {editingVideo ? "Edit Video & Card Details" : "Add New Video With Full Details Manually"}
            </h3>
            <button
              onClick={() => {
                setIsAdding(false)
                setEditingVideo(null)
              }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Video Name / Title *
              </label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. pre ani 4k or ShredTein 4K"
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Video File Path or Stream URL (.mp4) *
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={formData.videoUrl || ""}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="e.g. /assets/video/pre-ani-4k.mp4 or stream URL"
                  className="w-full sm:flex-1 min-w-0 text-xs font-mono px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  required
                />
                <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openGallery("videoUrl")}
                    className="w-full sm:w-auto bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Film size={13} />
                    <span>Gallery</span>
                  </button>
                  <label className="w-full sm:w-auto cursor-pointer bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs">
                    <Upload size={13} />
                    <span>Upload</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={(e) => handleUpload(e, "videoUrl")}
                    />
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className="text-[10px] text-zinc-400 font-bold self-center">Quick Select:</span>
                {[
                  { label: "ShredTein 4K", url: "/assets/video/shredtein-ani-video.mp4" },
                  { label: "Titan Pre-Workout 4K", url: "/assets/video/pre-ani-4k.mp4" },
                  { label: "NitroTein 4K", url: "/assets/video/shreded-ani-4k.mp4" },
                ].map((v) => (
                  <button
                    key={v.url}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, videoUrl: v.url }))}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Associated Product Name *
              </label>
              <input
                type="text"
                value={formData.productName || ""}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="e.g. Titan Loaded Pre-Workout"
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Product Slug (Store Link URL) *
              </label>
              <input
                type="text"
                value={formData.productSlug || ""}
                onChange={(e) => setFormData({ ...formData, productSlug: e.target.value })}
                placeholder="e.g. ignition-pre-workout or shred-tein-whey"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                required
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Product Image for Right-Side Cart *
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={formData.productImage || formData.poster || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, productImage: e.target.value, poster: e.target.value })
                  }
                  placeholder="e.g. /assets/recommendations/titan.jpg"
                  className="w-full sm:flex-1 min-w-0 text-xs font-mono px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  required
                />
                <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openGallery("productImage")}
                    className="w-full sm:w-auto bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ImageIcon size={13} />
                    <span>Gallery</span>
                  </button>
                  <label className="w-full sm:w-auto cursor-pointer bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs">
                    <Upload size={13} />
                    <span>Upload</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, "productImage")}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Badge Text on Card
              </label>
              <input
                type="text"
                value={formData.badge || ""}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="e.g. PUMP & FOCUS or LEAN MATRIX"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Video Display Mode
              </label>
              <select
                value={formData.objectFit || "cover"}
                onChange={(e) => setFormData({ ...formData, objectFit: e.target.value as "cover" | "contain" })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              >
                <option value="cover">Fill Area (Cover)</option>
                <option value="contain">Fit Inside (Contain)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.price || 2499}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  MRP (₹)
                </label>
                <input
                  type="number"
                  value={formData.mrp || 2999}
                  onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Servings / Package Detail
              </label>
              <input
                type="text"
                value={formData.servings || "30 Servings"}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                placeholder="e.g. 30 Servings or 1 KG (22 Servings)"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Kicker / Category Tag
              </label>
              <input
                type="text"
                value={formData.kicker || ""}
                onChange={(e) => setFormData({ ...formData, kicker: e.target.value })}
                placeholder="e.g. EXPLOSIVE PUMP & ENERGY"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Creator / Campaign
              </label>
              <input
                type="text"
                value={formData.creator || ""}
                onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                placeholder="e.g. Official Athlete Lab"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Tagline / Overlay Description
              </label>
              <input
                type="text"
                value={formData.tagline || ""}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="High-impact quote or formula description"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false)
                  setEditingVideo(null)
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
                {saving ? "Saving..." : editingVideo ? "Save All Details" : "Publish to Top Sellers"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm truncate">{previewVideo.title}</h3>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <video
                src={previewVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs text-zinc-300 flex items-center justify-between">
              <span>Product: <strong>{previewVideo.productName}</strong></span>
              <span>Price: <strong>{formatPrice(previewVideo.price || 0)}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Videos List Grid with Direct Edit */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading videos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="card bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center overflow-hidden group">
                  {vid.poster && (
                    <img
                      src={vid.poster}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70"
                    />
                  )}
                  <button
                    onClick={() => setPreviewVideo(vid)}
                    className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform"
                    title="Play Preview"
                  >
                    <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
                      <Play size={20} className="ml-1 fill-white" />
                    </div>
                  </button>

                  <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                    {vid.kicker || "4K SHOWCASE"}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      {vid.creator || "Official Showcase"}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        vid.isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {vid.isActive ? "Published" : "Hidden"}
                    </span>
                  </div>

                  {/* Editable Video Name */}
                  {inlineEditingId === vid.id ? (
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={inlineTitle}
                        onChange={(e) => setInlineTitle(e.target.value)}
                        className="text-xs font-bold px-2 py-1 border border-red-500 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => handleInlineSave(vid.id)}
                        className="p-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        title="Save name"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => setInlineEditingId(null)}
                        className="p-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg"
                        title="Cancel"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 group/title">
                      <h4 className="font-black text-sm text-zinc-900 dark:text-white line-clamp-1">
                        {vid.title}
                      </h4>
                      <button
                        onClick={() => {
                          setInlineEditingId(vid.id)
                          setInlineTitle(vid.title)
                        }}
                        className="text-[10px] text-zinc-400 hover:text-red-600 dark:hover:text-red-400 font-semibold opacity-70 group-hover/title:opacity-100 transition-opacity"
                        title="Quick edit video name"
                      >
                        Edit Name
                      </button>
                    </div>
                  )}

                  <div className="text-xs space-y-1 text-zinc-500 dark:text-zinc-400">
                    <p className="line-clamp-1">
                      Card: <strong className="text-zinc-800 dark:text-zinc-200">{vid.productName}</strong>
                    </p>
                    <p className="line-clamp-1">
                      Price: <strong className="text-zinc-800 dark:text-zinc-200">{formatPrice(vid.price || 0)}</strong>
                    </p>
                    <p className="text-[10px] text-zinc-400 font-mono truncate">
                      File: {vid.videoUrl}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggle(vid.id)}
                  className={`text-xs font-bold py-1.5 px-3 rounded-xl border transition-all ${
                    vid.isActive
                      ? "border-emerald-200 dark:border-emerald-800 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {vid.isActive ? "Active on Store" : "Enable"}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingVideo(vid)
                      setFormData({ ...vid, objectFit: vid.objectFit || "cover" })
                      setIsAdding(true)
                    }}
                    className="py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1"
                    title="Edit all video and card details"
                  >
                    <Edit2 size={12} /> Edit Details
                  </button>
                  <button
                    onClick={() => handleDelete(vid.id)}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete video"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Gallery Selection Modal */}
      {galleryTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in border border-zinc-200 dark:border-zinc-800 my-auto">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm">
                <ImageIcon size={16} className="text-red-500" /> Select Media from Gallery
              </h3>
              <button
                onClick={() => setGalleryTarget(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-zinc-100/50 dark:bg-zinc-950/50">
              {galleryAssets.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <p className="font-semibold text-sm">No media found in your gallery.</p>
                  <p className="text-xs mt-1">Upload images or videos via the Media Manager first, or use the Upload button.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {galleryAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          [galleryTarget]: asset.url,
                          ...(galleryTarget === "productImage" ? { poster: asset.url } : {}),
                        }))
                        setGalleryTarget(null)
                        toast.success("Media selected from gallery!")
                      }}
                      className="group relative aspect-square bg-white dark:bg-zinc-900 rounded-2xl border-2 border-transparent hover:border-red-500 cursor-pointer overflow-hidden shadow-sm transition-all hover:shadow-md"
                    >
                      {asset.type === "video" || asset.url?.endsWith(".mp4") ? (
                        <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-zinc-400 p-2">
                          <Film size={28} className="text-red-500 mb-1" />
                          <span className="text-[9px] font-mono truncate max-w-full">{asset.name || "Video"}</span>
                        </div>
                      ) : (
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-white">
                        <p className="text-[9px] font-bold truncate">{asset.name}</p>
                        <p className="text-[8px] opacity-75">{asset.category || asset.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

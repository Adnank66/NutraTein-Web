"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Package, Upload, X, Plus, Save, Eye, EyeOff, Star, ArrowLeft,
  Loader2, ImagePlus, Trash2, Check, AlertTriangle, Sparkles, Tag
} from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  slug: string
}

interface Variant {
  id?: string
  flavor: string
  size: string
  sku: string
  price: number | string
  stock: number | string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])

  const [form, setForm] = useState({
    name: "",
    slug: "",
    brand: "NUTRATEIN",
    description: "",
    shortDescription: "",
    categoryId: "",
    basePrice: 0,
    mrp: 0,
    discountPercent: 0,
    isFeatured: false,
    isBestSeller: false,
    isNew: false,
    isActive: true,
  })

  const [images, setImages] = useState<{ url: string; isPrimary: boolean }[]>([])
  const [variants, setVariants] = useState<Variant[]>([])

  // Fetch product data and categories
  useEffect(() => {
    if (!id) return

    Promise.all([
      fetch(`/api/admin/products/${id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([prodData, catData]) => {
        if (catData.categories || catData.data) {
          setCategories(catData.categories || catData.data || [])
        }

        if (prodData.product) {
          const p = prodData.product
          setForm({
            name: p.name || "",
            slug: p.slug || "",
            brand: p.brand || "NUTRATEIN",
            description: p.description || "",
            shortDescription: p.shortDescription || "",
            categoryId: p.categoryId || "",
            basePrice: p.basePrice || 0,
            mrp: p.mrp || 0,
            discountPercent: p.discountPercent || 0,
            isFeatured: !!p.isFeatured,
            isBestSeller: !!p.isBestSeller,
            isNew: !!p.isNew,
            isActive: !!p.isActive,
          })

          if (p.images && p.images.length > 0) {
            setImages(p.images.map((img: any) => ({ url: img.url, isPrimary: !!img.isPrimary })))
          }

          if (p.variants && p.variants.length > 0) {
            setVariants(
              p.variants.map((v: any) => ({
                id: v.id,
                flavor: v.flavor || "",
                size: v.size || "",
                sku: v.sku || "",
                price: v.price || 0,
                stock: v.stock || 0,
              }))
            )
          }
        } else {
          toast.error("Product not found")
        }
      })
      .catch((err) => {
        toast.error("Failed to load product details: " + err.message)
      })
      .finally(() => setLoading(false))
  }, [id])

  // Handle direct image file upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploadingImage(true)
    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Upload failed")
        setImages((prev) => [...prev, { url: data.url, isPrimary: prev.length === 0 }])
        toast.success(`${file.name} uploaded successfully!`)
      } catch (err: any) {
        toast.error(err.message || "Failed to upload image")
      }
    }
    setUploadingImage(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const addImageUrl = () => {
    const url = prompt("Enter or paste direct image URL:")?.trim()
    if (url) {
      setImages((prev) => [...prev, { url, isPrimary: prev.length === 0 }])
    }
  }

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== idx)
      if (updated.length > 0 && !updated.some((i) => i.isPrimary)) {
        updated[0].isPrimary = true
      }
      return updated
    })
  }

  const setPrimaryImage = (idx: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })))
  }

  // Variant management
  const addVariant = () => {
    const newSku = `${form.name.substring(0, 3).toUpperCase()}-VAR-${Date.now().toString().slice(-4)}`
    setVariants((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        flavor: "Standard",
        size: "1 KG",
        sku: newSku,
        price: form.basePrice || 999,
        stock: 50,
      },
    ])
  }

  const removeVariant = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateVariant = (idx: number, field: keyof Variant, value: any) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    )
  }

  // Save changes
  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required")
      return
    }
    if (!form.slug.trim()) {
      toast.error("Product slug is required")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim(),
        categoryId: form.categoryId || null,
        basePrice: Number(form.basePrice) || 0,
        mrp: Number(form.mrp) || Number(form.basePrice) || 0,
        discountPercent: Number(form.discountPercent) || 0,
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
        isNew: form.isNew,
        isActive: form.isActive,
        images: images.map((img) => ({ url: img.url, isPrimary: img.isPrimary })),
        variants: variants.map((v) => ({
          id: v.id,
          flavor: v.flavor,
          size: v.size,
          sku: v.sku,
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
        })),
      }

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update product")

      toast.success("Product card and details updated successfully!")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  // Delete product
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${form.name}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete product")

      toast.success("Product permanently deleted.")
      router.push("/admin/products")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 size={32} className="animate-spin text-brand-600" />
        <p className="text-sm font-semibold">Loading product configuration...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-semibold mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Products Catalog
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <Package size={24} className="text-brand-600" />
              Edit Product: {form.name}
            </h1>
            <span
              className={`badge text-xs font-bold px-2.5 py-0.5 rounded-full ${
                form.isActive
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {form.isActive ? "● Active in Store" : "○ Draft (Hidden)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={14} /> {deleting ? "Deleting..." : "Delete Product"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary py-2.5 px-5 text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save size={16} /> Save Product Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2-Column Area: Info & Variants */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details Card */}
          <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Package size={16} className="text-brand-600" /> General Product Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. NUTRATEIN 100% Whey Isolate"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Slug / URL Key *
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="nutratein-whey-isolate"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="NUTRATEIN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Short Tagline / Card Description
                  </label>
                  <input
                    type="text"
                    value={form.shortDescription}
                    onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Pure Grass-Fed Ultrafiltered Whey Matrix"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Detailed Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
                  placeholder="Detailed breakdown of ingredients, microfiltration, bioavailability, and usage instructions..."
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock Card */}
          <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Tag size={16} className="text-brand-600" /> Pricing & Discount Offers
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.basePrice}
                  onChange={(e) => setForm((p) => ({ ...p, basePrice: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Maximum Retail Price (MRP ₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.mrp}
                  onChange={(e) => setForm((p) => ({ ...p, mrp: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPercent}
                  onChange={(e) => setForm((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Product Variants & Stock */}
          <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>📦</span> Variants & Live Stock Inventory ({variants.length})
              </h2>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-xl border border-brand-200 dark:border-brand-800/60"
              >
                <Plus size={13} /> Add Variant
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={v.id || idx}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end"
                >
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">Flavor</label>
                    <input
                      type="text"
                      value={v.flavor}
                      onChange={(e) => updateVariant(idx, "flavor", e.target.value)}
                      placeholder="Chocolate"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">Size / Weight</label>
                    <input
                      type="text"
                      value={v.size}
                      onChange={(e) => updateVariant(idx, "size", e.target.value)}
                      placeholder="1 KG"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">SKU</label>
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                      placeholder="WHEY-CHO-1KG"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => updateVariant(idx, "price", Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">Stock Units</label>
                    <input
                      type="number"
                      value={v.stock}
                      onChange={(e) => updateVariant(idx, "stock", Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                  </div>

                  <div className="flex justify-end pb-1">
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors"
                      title="Remove variant"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Status Toggles & Images */}
        <div className="space-y-6">
          {/* Card Visibility & Badges */}
          <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-brand-600" /> Visibility & Badges
            </h2>

            <div className="space-y-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">Active on Storefront</p>
                  <p className="text-[10px] text-zinc-500">Show or hide card on shop & deals pages</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    form.isActive ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                      form.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">Best Seller Badge</p>
                  <p className="text-[10px] text-zinc-500">Display &quot;BEST SELLER&quot; card tag</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isBestSeller: !p.isBestSeller }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    form.isBestSeller ? "bg-brand-500" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                      form.isBestSeller ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">New Arrival Badge</p>
                  <p className="text-[10px] text-zinc-500">Display &quot;NEW&quot; card tag</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isNew: !p.isNew }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    form.isNew ? "bg-brand-500" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                      form.isNew ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Product Imagery */}
          <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ImagePlus size={16} className="text-brand-600" /> Imagery & Gallery
              </h2>
              <span className="text-[10px] text-zinc-400">{images.length} images</span>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2.5">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 bg-zinc-100 dark:bg-zinc-800 ${
                    img.isPrimary
                      ? "border-brand-500 ring-2 ring-brand-500/20"
                      : "border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <img
                    src={img.url}
                    alt="Product preview"
                    className="w-full h-full object-contain p-1"
                  />

                  {img.isPrimary && (
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-black bg-brand-600 text-white px-1.5 py-0.5 rounded shadow">
                      PRIMARY
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(idx)}
                        className="p-1 rounded bg-white text-zinc-900 text-[10px] font-bold"
                        title="Set as primary"
                      >
                        Set Main
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1 rounded bg-rose-600 text-white"
                      title="Delete image"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full py-2.5 rounded-xl border border-dashed border-brand-400 dark:border-brand-600 bg-brand-50/50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-50 transition-colors cursor-pointer"
              >
                <Upload size={14} />
                <span>{uploadingImage ? "Uploading from Files..." : "Upload from Files / Gallery"}</span>
              </button>

              <button
                type="button"
                onClick={addImageUrl}
                className="w-full py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                + Paste Image URL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

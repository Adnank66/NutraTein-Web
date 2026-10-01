"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Package, Upload, X, Plus, Save, Eye, EyeOff, Star, ChevronLeft,
  Loader2, ImagePlus, Trash2, Check, AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

interface Category { id: string; name: string; slug: string }
interface VariantForm { flavor: string; size: string; sku: string; price: string; stock: string }

const EMPTY_VARIANT: VariantForm = { flavor: "", size: "", sku: "", price: "", stock: "" }

export default function AddProductPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({
    name: "",
    brand: "NUTRATEIN",
    slug: "",
    description: "",
    shortDesc: "",
    basePrice: "",
    mrp: "",
    discountPercent: "0",
    howToUse: "",
    ingredients: "",
    benefits: "",
    nutritionInfo: "",
    tags: "",
    isFeatured: false,
    isBestSeller: false,
    isNew: true,
    isActive: true,
    categoryId: "",
  })
  const [variants, setVariants] = useState<VariantForm[]>([{ ...EMPTY_VARIANT }])
  const [images, setImages] = useState<{ url: string; isPrimary: boolean; uploading?: boolean }[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
  }, [])

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    setForm((p) => ({ ...p, name: val, slug: p.slug || slug }))
  }

  // ── Image upload ─────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    for (const file of files) {
      const tempId = Date.now() + Math.random()
      const previewUrl = URL.createObjectURL(file)
      const isFirstImage = images.length === 0

      setImages((prev) => [...prev, { url: previewUrl, isPrimary: isFirstImage, uploading: true }])

      const formData = new FormData()
      formData.append("file", file)
      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setImages((prev) => {
          const idx = prev.findIndex((i) => i.url === previewUrl)
          if (idx === -1) return prev
          const updated = [...prev]
          updated[idx] = { url: data.url, isPrimary: isFirstImage && idx === 0, uploading: false }
          return updated
        })
        toast.success(`${file.name} uploaded!`)
      } catch (err: any) {
        setImages((prev) => prev.filter((i) => i.url !== previewUrl))
        toast.error(err.message || "Upload failed")
      }
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const addImageUrl = () => {
    const url = prompt("Paste an image URL:")?.trim()
    if (url) setImages((p) => [...p, { url, isPrimary: p.length === 0 }])
  }

  const removeImage = (idx: number) => setImages((p) => p.filter((_, i) => i !== idx))
  const setPrimaryImage = (idx: number) =>
    setImages((p) => p.map((img, i) => ({ ...img, isPrimary: i === idx })))

  // ── Variant management ───────────────────────────────────────────────────
  const addVariant = () => setVariants((p) => [...p, { ...EMPTY_VARIANT }])
  const removeVariant = (idx: number) => setVariants((p) => p.filter((_, i) => i !== idx))
  const updateVariant = (idx: number, key: keyof VariantForm, val: string) =>
    setVariants((p) => p.map((v, i) => (i === idx ? { ...v, [key]: val } : v)))

  // Auto-generate SKU
  const autoSku = (idx: number) => {
    const v = variants[idx]
    const base = form.name.substring(0, 4).toUpperCase().replace(/\s/g, "")
    const fl = (v.flavor || "DEF").substring(0, 3).toUpperCase()
    const sz = (v.size || "1KG").replace(/\s/g, "").toUpperCase()
    const sku = `${base}-${fl}-${sz}-${Date.now().toString().slice(-4)}`
    updateVariant(idx, "sku", sku)
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (publish: boolean) => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Product name and slug are required")
      return
    }
    if (!form.categoryId) {
      toast.error("Please select a category")
      return
    }
    if (!form.basePrice || isNaN(Number(form.basePrice))) {
      toast.error("Enter a valid base price")
      return
    }
    if (variants.some((v) => !v.sku.trim())) {
      toast.error("All variants need a SKU")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        shortDesc: form.shortDesc.trim() || undefined,
        basePrice: Number(form.basePrice),
        mrp: Number(form.mrp) || Number(form.basePrice),
        discountPercent: Number(form.discountPercent) || 0,
        categoryId: form.categoryId,
        howToUse: form.howToUse.trim() || undefined,
        ingredients: form.ingredients.trim() || undefined,
        benefits: form.benefits.trim() || undefined,
        nutritionInfo: form.nutritionInfo.trim() || undefined,
        tags: form.tags.trim() || undefined,
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
        isNew: form.isNew,
        isActive: publish,
        images: images.filter((i) => !i.uploading).map((img, idx) => ({
          url: img.url,
          isPrimary: img.isPrimary,
          sortOrder: idx,
          alt: form.name,
        })),
        variants: variants.map((v) => ({
          flavor: v.flavor.trim() || undefined,
          size: v.size.trim() || undefined,
          sku: v.sku.trim(),
          price: Number(v.price) || Number(form.basePrice),
          stock: Number(v.stock) || 0,
          isActive: true,
        })),
      }

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create product")

      toast.success(publish ? "Product published live! 🎉" : "Saved as draft")
      router.push("/admin/products")
    } catch (err: any) {
      toast.error(err.message || "Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Package size={20} className="text-brand-600" /> Add New Product
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Fill in all product details, upload images, and add variants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Main Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">Product Name *</label>
                <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. NUTRATEIN 100% Whey Isolate" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">URL Slug *</label>
                <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="nutratein-whey-isolate" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-mono bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">Brand</label>
                <input value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">Category *</label>
                <select value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Select a category...</option>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">Short Description</label>
                <input value={form.shortDesc} onChange={(e) => setForm((p) => ({ ...p, shortDesc: e.target.value }))} placeholder="One-liner for product cards" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">Tags (comma-separated)</label>
                <input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="whey, protein, isolate, muscle" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">Full Description *</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={5} placeholder="Detailed product description..." className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">Pricing</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">Base Price (₹) *</label>
                <input type="number" value={form.basePrice} onChange={(e) => setForm((p) => ({ ...p, basePrice: e.target.value }))} placeholder="4499" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">MRP / Original (₹)</label>
                <input type="number" value={form.mrp} onChange={(e) => setForm((p) => ({ ...p, mrp: e.target.value }))} placeholder="5499" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">Discount %</label>
                <input type="number" value={form.discountPercent} onChange={(e) => setForm((p) => ({ ...p, discountPercent: e.target.value }))} min="0" max="100" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">Variants (Flavors & Sizes)</h2>
              <button onClick={addVariant} className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/30 px-3 py-1.5 rounded-lg">
                <Plus size={13} /> Add Variant
              </button>
            </div>
            <div className="space-y-4">
              {variants.map((v, idx) => (
                <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Variant {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => autoSku(idx)} className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline">Auto-SKU</button>
                      {variants.length > 1 && (
                        <button onClick={() => removeVariant(idx)} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Flavor</label>
                      <input value={v.flavor} onChange={(e) => updateVariant(idx, "flavor", e.target.value)} placeholder="Chocolate Fudge" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Size</label>
                      <input value={v.size} onChange={(e) => updateVariant(idx, "size", e.target.value)} placeholder="1 KG (33 Servings)" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">SKU *</label>
                      <input value={v.sku} onChange={(e) => updateVariant(idx, "sku", e.target.value)} placeholder="NUTR-CHO-1KG-001" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs font-mono bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Price (₹)</label>
                      <input type="number" value={v.price} onChange={(e) => updateVariant(idx, "price", e.target.value)} placeholder={form.basePrice || "4499"} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Stock Qty</label>
                      <input type="number" value={v.stock} onChange={(e) => updateVariant(idx, "stock", e.target.value)} placeholder="50" min="0" className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supplement Details */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">Supplement Details</h2>
            {[
              { key: "ingredients", label: "Ingredients / Supplement Facts", placeholder: "Whey Protein Isolate, Cocoa, Stevia..." },
              { key: "benefits", label: "Key Benefits", placeholder: "27g protein per serving, 0g sugar, lab tested..." },
              { key: "nutritionInfo", label: "Nutrition Information (per serving)", placeholder: "Calories: 120, Protein: 27g, Carbs: 3g, Fat: 1g..." },
              { key: "howToUse", label: "How to Use / Directions", placeholder: "Mix 1 scoop with 200ml cold water or milk..." },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">{label}</label>
                <textarea
                  value={(form as any)[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  rows={3}
                  placeholder={placeholder}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Images + Flags + Actions */}
        <div className="space-y-5">
          {/* Images */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
              <ImagePlus size={15} className="text-brand-600" /> Product Images
            </h2>

            {/* Upload area */}
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-brand-400 dark:hover:border-brand-600 transition-colors group"
              >
                <Upload size={20} className="text-zinc-400 dark:text-zinc-500 group-hover:text-brand-500" />
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-brand-600 dark:group-hover:text-brand-400">Click to upload images</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">PNG, JPG, WebP • Max 5MB each</p>
                <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium mt-0.5">Recommended: 800×800px square (any dimension auto-fits cleanly)</p>
              </button>
              <button type="button" onClick={addImageUrl} className="w-full mt-2 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline py-1">
                + Add image by URL
              </button>
            </div>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="space-y-2">
                {images.map((img, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${img.isPrimary ? "border-brand-400 bg-brand-50 dark:bg-brand-950/20 dark:border-brand-700" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"}`}>
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0 flex items-center justify-center">
                      {img.uploading ? (
                        <Loader2 size={16} className="animate-spin text-brand-500" />
                      ) : (
                        <Image src={img.url} alt={`Product ${idx + 1}`} fill className="object-contain p-1" unoptimized />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 truncate">{img.url.split("/").pop()}</p>
                      {img.isPrimary && <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400">⭐ PRIMARY</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {!img.isPrimary && !img.uploading && (
                        <button onClick={() => setPrimaryImage(idx)} title="Set as primary" className="p-1 text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400">
                          <Star size={12} />
                        </button>
                      )}
                      <button onClick={() => removeImage(idx)} className="p-1 text-rose-400 hover:text-rose-600">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {images.length === 0 && (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center">No images yet. Upload or add a URL.</p>
            )}
          </div>

          {/* Flags */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">Labels & Flags</h2>
            {[
              { key: "isFeatured", label: "Featured Product", desc: "Show on homepage featured section" },
              { key: "isBestSeller", label: "Best Seller", desc: "Shows 'Best Seller' badge on card" },
              { key: "isNew", label: "New Arrival", desc: "Shows 'New' badge on product card" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between" onClick={() => setForm((p) => ({ ...p, [key]: !(p as any)[key] }))}>
                <div>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">{label}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{desc}</p>
                </div>
                <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${(form as any)[key] ? "bg-brand-600" : "bg-zinc-300 dark:bg-zinc-600"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${(form as any)[key] ? "right-0.5" : "left-0.5"}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3">Save & Publish</h2>
            <button
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
              Publish Live
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-3 px-4 rounded-xl text-sm transition-colors disabled:opacity-60"
            >
              <EyeOff size={15} /> Save as Draft
            </button>
            <button onClick={() => router.back()} className="w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 py-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

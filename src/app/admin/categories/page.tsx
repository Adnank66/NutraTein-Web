"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Layers, Plus, Edit2, Trash2, Save, X, ExternalLink,
  Package, Check, ArrowRight, RotateCcw, AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  icon?: string | null
  sortOrder: number
  _count?: { products: number }
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state for Add/Edit
  const [formName, setFormName] = useState("")
  const [formSlug, setFormSlug] = useState("")
  const [formType, setFormType] = useState("PRODUCT")
  const [formLinkedSlug, setFormLinkedSlug] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formIcon, setFormIcon] = useState("")
  const [formSortOrder, setFormSortOrder] = useState(10)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/categories")
      const data = await res.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch {
      toast.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const openAddModal = () => {
    setEditingCategory(null)
    setFormName("")
    setFormSlug("")
    setFormType("PRODUCT")
    setFormLinkedSlug("")
    setFormDesc("")
    setFormIcon("⚡")
    setFormSortOrder(categories.length + 1)
    setShowAddModal(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormSlug(cat.slug)
    setFormType((cat as any).type || "PRODUCT")
    setFormLinkedSlug((cat as any).linkedCategorySlug || "")
    setFormDesc(cat.description || "")
    setFormIcon(cat.icon || "⚡")
    setFormSortOrder(cat.sortOrder || 1)
    setShowAddModal(true)
  }

  const handleNameChange = (val: string) => {
    setFormName(val)
    if (!editingCategory) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      setFormSlug(autoSlug)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error("Category name is required")
      return
    }

    setSaving(true)
    try {
      if (editingCategory) {
        // Edit existing
        const res = await fetch("/api/admin/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCategory.id,
            name: formName.trim(),
            slug: formSlug.trim(),
            type: formType,
            linkedCategorySlug: formType === "GOAL" ? formLinkedSlug : null,
            description: formDesc.trim() || null,
            icon: formIcon.trim() || null,
            sortOrder: Number(formSortOrder) || 1,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to update")
        toast.success(`Category "${formName}" updated successfully!`)
      } else {
        // Add new
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            slug: formSlug.trim(),
            type: formType,
            linkedCategorySlug: formType === "GOAL" ? formLinkedSlug : null,
            description: formDesc.trim() || null,
            icon: formIcon.trim() || null,
            sortOrder: Number(formSortOrder) || 1,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to create")
        toast.success(`Category "${formName}" created successfully!`)
      }

      setShowAddModal(false)
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message || "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return

    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete")
      toast.success(`Category "${cat.name}" deleted`)
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category")
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Layers size={24} className="text-brand-600" />
            Category Editing & Management Panel ({categories.length})
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Organize products into store categories, customize URLs, and manage which categories appear on the shop page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCategories}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <RotateCcw size={13} /> Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="btn-primary py-2 px-4 text-xs font-bold"
          >
            <Plus size={14} /> Add New Category
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="text-center py-20 text-zinc-400 text-sm">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="card p-12 text-center space-y-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <Layers size={40} className="mx-auto text-zinc-300 dark:text-zinc-700" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">No categories found</h3>
          <p className="text-xs text-zinc-500">Click &quot;Add New Category&quot; above to create your first product category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg font-bold">
                      {c.icon || "🏷️"}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                        {c.name}
                      </h3>
                      <span className="font-mono text-[11px] text-zinc-400">/{c.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="badge text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      Order: #{c.sortOrder}
                    </span>
                    <span className={`badge text-[10px] font-bold px-2 py-0.5 rounded-full ${(c as any).type === "GOAL" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                      {(c as any).type === "GOAL" ? "Goal" : "Product"}
                    </span>
                  </div>
                </div>

                {c.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Package size={13} className="text-zinc-400" />
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {c._count?.products ?? 0}
                  </span>
                  <span>products</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/shop?category=${c.slug}`}
                    target="_blank"
                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                    title="View on storefront"
                  >
                    <ExternalLink size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Edit category"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers size={18} className="text-brand-600" />
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Gear & Accessories, Whey Protein"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  URL Slug (Auto-generated or custom) *
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="gear, whey-protein"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Category Type *
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="PRODUCT">Shop by Product (e.g. Pre-workout)</option>
                  <option value="GOAL">Shop by Goal (e.g. Muscle Growth)</option>
                </select>
              </div>

              {formType === "GOAL" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Linked Product Category Slug (Suggests products from here) *
                  </label>
                  <select
                    value={formLinkedSlug}
                    onChange={(e) => setFormLinkedSlug(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="" disabled>Select a product category...</option>
                    {categories.filter(c => (c as any).type !== "GOAL").map(c => (
                      <option key={c.id} value={c.slug}>{c.name} (/{c.slug})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Icon / Emoji
                  </label>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="🥤, ⚡, 💪"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Short description shown on category filters and headers..."
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs py-2 px-5 font-bold"
                >
                  {saving ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

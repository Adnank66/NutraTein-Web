"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/utils"
import { Search, Package, Plus, Minus, Check, Edit2, AlertCircle, Sparkles, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Variant {
  id: string
  flavor: string | null
  size: string | null
  price: number
  stock: number
  isActive: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  basePrice: number
  mrp: number
  isActive: boolean
  category: { name: string }
  images: { url: string }[]
  variants: Variant[]
}

export default function ProductsManagerTable({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [clearedProducts, setClearedProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [selectedCat, setSelectedCat] = useState("ALL")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingVariant, setEditingVariant] = useState<{ productId: string; variant: Variant } | null>(null)
  const [newStock, setNewStock] = useState<number>(0)
  const [newPrice, setNewPrice] = useState<number>(0)

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean)))]

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.variants.some((v) => (v.flavor || "").toLowerCase().includes(search.toLowerCase()))
    const matchCat = selectedCat === "ALL" || p.category?.name === selectedCat
    return matchSearch && matchCat
  })

  const handleStockDelta = async (productId: string, variantId: string, delta: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const variant = product.variants.find((v) => v.id === variantId)
    if (!variant) return

    const targetStock = Math.max(0, variant.stock + delta)
    setUpdatingId(variantId)

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants: [{ id: variantId, stock: targetStock }],
        }),
      })

      if (!res.ok) throw new Error("Failed to update stock")

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                variants: p.variants.map((v) =>
                  v.id === variantId ? { ...v, stock: targetStock } : v
                ),
              }
            : p
        )
      )
      toast.success(`Updated stock to ${targetStock} units`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update stock")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleInlineStockChange = async (productId: string, variantId: string, val: number) => {
    const targetStock = Math.max(0, val)
    setUpdatingId(variantId)

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants: [{ id: variantId, stock: targetStock }],
        }),
      })

      if (!res.ok) throw new Error("Failed to update stock")

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                variants: p.variants.map((v) =>
                  v.id === variantId ? { ...v, stock: targetStock } : v
                ),
              }
            : p
        )
      )
      toast.success(`Live stock updated to ${targetStock}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update stock")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${productName}" from the database? This cannot be undone.`)) return
    setUpdatingId(productId)

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete product")

      setProducts((prev) => prev.filter((p) => p.id !== productId))
      toast.success(`"${productName}" permanently deleted from MongoDB`)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleSaveVariantEdit = async () => {
    if (!editingVariant) return
    const { productId, variant } = editingVariant
    setUpdatingId(variant.id)

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants: [{ id: variant.id, stock: Number(newStock), price: Number(newPrice) }],
        }),
      })

      if (!res.ok) throw new Error("Failed to update variant")

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                variants: p.variants.map((v) =>
                  v.id === variant.id ? { ...v, stock: Number(newStock), price: Number(newPrice) } : v
                ),
              }
            : p
        )
      )
      toast.success("Variant stock and pricing updated!")
      setEditingVariant(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to save variant")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    setUpdatingId(productId)
    const newStatus = !currentStatus

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (!res.ok) throw new Error("Failed to update product status")

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isActive: newStatus } : p))
      )
      toast.success(`Product is now ${newStatus ? "ACTIVE on Storefront" : "DRAFT (Hidden)"}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to update product status")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleClearAllProducts = () => {
    if (!confirm("Clear products from admin view? (Your database and storefront remain 100% safe. You can recover them anytime with one click.)")) return
    setClearedProducts(products)
    setProducts([])
    toast.success("Products cleared from view. Click 'Recover Cleared Data' anytime to restore.")
  }

  const handleRecoverAllProducts = () => {
    if (clearedProducts.length > 0) {
      setProducts(clearedProducts)
      setClearedProducts([])
    } else {
      setProducts(initialProducts)
    }
    toast.success("All products restored to admin view!")
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search products, formulas, flavors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCat === cat
                    ? "bg-brand-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Action Buttons: Clear All & Recover Deleted Data */}
          <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-3 ml-auto">
            {products.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllProducts}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 transition-colors"
                title="Temporarily clear products from view (keeps database intact)"
              >
                <Trash2 size={12} />
                <span>Clear All</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRecoverAllProducts}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 transition-colors"
              title="Restore all cleared products into view"
            >
              <RotateCcw size={12} />
              <span>Recover Cleared Data {clearedProducts.length > 0 ? `(${clearedProducts.length})` : ""}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4">Product Formulation</th>
                <th className="p-4">Category</th>
                <th className="p-4">Base Price</th>
                <th className="p-4">Variants & Stock Inventory</th>
                <th className="p-4">Storefront Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-400">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
                  const img = p.images[0]?.url || "/assets/products/whey.jpg"

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      {/* Product Name & Image */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-zinc-200 dark:border-zinc-700 shrink-0">
                            <Image src={img} alt={p.name} fill className="object-contain p-1" />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-zinc-900 dark:text-white truncate">{p.name}</p>
                            <p className="text-[11px] text-zinc-400">
                              {p.variants.length} variant(s) • Total Stock:{" "}
                              <strong className={totalStock <= 25 ? "text-amber-600" : "text-emerald-600"}>
                                {totalStock} units
                              </strong>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4 font-semibold text-zinc-600 dark:text-zinc-300">
                        {p.category?.name || "General"}
                      </td>

                      {/* Price */}
                      <td className="p-4">
                        <p className="font-black text-zinc-900 dark:text-white text-sm">{formatPrice(p.basePrice)}</p>
                        <p className="text-[10px] text-zinc-400 line-through">{formatPrice(p.mrp)}</p>
                      </td>

                      {/* Variants Stock Controls */}
                      <td className="p-4">
                        <div className="space-y-2 max-w-md">
                          {p.variants.map((v) => (
                            <div
                              key={v.id}
                              className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2"
                            >
                              <div>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                  {[v.flavor, v.size].filter(Boolean).join(" • ") || "Standard"}
                                </span>
                                <span className="text-zinc-400 ml-2 font-mono">{formatPrice(v.price)}</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Live Inline Stock Input */}
                                <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-0.5">
                                  <span className="text-[10px] text-zinc-400 font-bold uppercase">Stock:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    defaultValue={v.stock}
                                    key={`stock-${v.id}-${v.stock}`}
                                    disabled={updatingId === v.id}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        (e.currentTarget as HTMLInputElement).blur()
                                      }
                                    }}
                                    onBlur={(e) => {
                                      const val = parseInt(e.target.value, 10)
                                      if (!isNaN(val) && val !== v.stock) {
                                        handleInlineStockChange(p.id, v.id, val)
                                      }
                                    }}
                                    title="Click to type exact stock and press Enter or blur to save"
                                    className="w-14 text-center font-bold text-xs bg-transparent text-zinc-900 dark:text-zinc-100 outline-none"
                                  />
                                </div>

                                {/* Quick Delta Buttons */}
                                <button
                                  onClick={() => handleStockDelta(p.id, v.id, -5)}
                                  disabled={updatingId === v.id || v.stock <= 0}
                                  title="Subtract 5 units"
                                  className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 flex items-center justify-center text-zinc-700 dark:text-zinc-200 text-xs font-bold disabled:opacity-40"
                                >
                                  -5
                                </button>

                                <button
                                  onClick={() => handleStockDelta(p.id, v.id, 10)}
                                  disabled={updatingId === v.id}
                                  title="Add 10 units"
                                  className="w-6 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 flex items-center justify-center text-zinc-700 dark:text-zinc-200 text-xs font-bold disabled:opacity-40"
                                >
                                  +10
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingVariant({ productId: p.id, variant: v })
                                    setNewStock(v.stock)
                                    setNewPrice(v.price)
                                  }}
                                  title="Edit custom stock & price modal"
                                  className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 transition-colors"
                                >
                                  <Edit2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Storefront Active Toggle */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleProductStatus(p.id, p.isActive)}
                          disabled={updatingId === p.id}
                          className={`badge text-[11px] font-bold py-1 px-3 rounded-lg transition-colors cursor-pointer ${
                            p.isActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {p.isActive ? "● Active in Store" : "○ Draft (Hidden)"}
                        </button>
                      </td>

                      {/* Full Product Edit & Permanent Delete */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] transition-colors"
                            title="Edit full product details, card, and imagery"
                          >
                            <Edit2 size={12} />
                            <span>Edit Card</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            disabled={updatingId === p.id}
                            className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Permanently delete product from MongoDB Atlas"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Variant Custom Modal */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-scale-in">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Edit Variant Stock & Price
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {[editingVariant.variant.flavor, editingVariant.variant.size].filter(Boolean).join(" • ") || "Variant"}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Stock Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingVariant(null)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVariantEdit}
                disabled={updatingId === editingVariant.variant.id}
                className="btn-primary text-xs py-1.5 px-4"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeftRight, Trash2, X, Plus, ShoppingBag,
  Star, Check, AlertCircle, ArrowLeft, Search
} from "lucide-react"
import { useCompareStore, CompareProductItem } from "@/store/compare"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

export default function ComparePage() {
  const { items, removeItem, clearCompare, addItem } = useCompareStore()
  const addToCart = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const [mounted, setMounted] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [catalogProducts, setCatalogProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleClearOne = (id: string, name: string) => {
    removeItem(id)
    setSelectedIds((prev) => prev.filter((x) => x !== id))
    toast.success(`Removed ${name} from comparison`)
  }

  const handleClearSelected = () => {
    if (selectedIds.length === 0) return
    const count = selectedIds.length
    selectedIds.forEach((id) => removeItem(id))
    setSelectedIds([])
    toast.success(`${count} selected item(s) removed from comparison`)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load catalog products for the picker modal when opened
  useEffect(() => {
    if (pickerOpen && catalogProducts.length === 0) {
      setLoadingCatalog(true)
      fetch("/api/products")
        .then((res) => res.json())
        .then((res) => {
          if (res.data) setCatalogProducts(res.data)
        })
        .catch(() => {})
        .finally(() => setLoadingCatalog(false))
    }
  }, [pickerOpen, catalogProducts.length])

  if (!mounted) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mx-auto"></div>
          <div className="h-64 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-full max-w-4xl mx-auto"></div>
        </div>
      </div>
    )
  }

  const handleAddToCart = (item: CompareProductItem) => {
    addToCart({
      id: item.id,
      productId: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      mrp: item.mrp || item.price,
      image: item.image,
      quantity: 1,
      stock: item.stock ?? 50,
      slug: item.slug,
    })
    toast.success("Added to cart", {
      description: item.name,
    })
    openCart()
  }

  const handleAddFromCatalog = (product: any) => {
    const item: CompareProductItem = {
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.variants?.[0]?.price ?? product.basePrice,
      mrp: product.mrp,
      image: product.images?.[0]?.url || "/assets/products/whey.jpg",
      slug: product.slug,
      rating: product.rating,
      category: product.category?.name,
      stock: product.variants?.[0]?.stock ?? 50,
      shortDescription: product.shortDesc,
    }
    const success = addItem(item)
    if (success) {
      toast.success("Added to comparison", { description: product.name })
      setPickerOpen(false)
    } else {
      toast.error("Already in comparison")
    }
  }

  const filteredCatalog = catalogProducts.filter((p) => {
    const alreadyInCompare = items.some((i) => i.id === p.id)
    if (alreadyInCompare) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    )
  })

  // Empty State
  if (items.length === 0) {
    return (
      <div className="container-custom py-20 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
            <ArrowLeftRight size={36} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
              No Products to Compare
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Select 2 to 4 products across our catalog to compare nutritional specs, pricing, and ingredients side by side.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/shop" className="btn-primary py-3 px-8 text-sm font-bold inline-flex items-center gap-2">
              <ArrowLeft size={16} /> Explore Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-10 sm:py-12 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/shop"
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={13} /> Back to Shop
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            Compare Products
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {items.length} / 4 items
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Analyze formulas, price-to-protein ratio, and specifications side by side.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {items.length < 4 && (
            <button
              onClick={() => setPickerOpen(true)}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5"
            >
              <Plus size={15} /> Add Product
            </button>
          )}

          {selectedIds.length > 0 ? (
            <button
              onClick={handleClearSelected}
              className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="Remove selected products from comparison"
            >
              <Trash2 size={15} />
              <span>Clear Selected ({selectedIds.length})</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (items.length > 0) {
                  handleClearOne(items[items.length - 1].id, items[items.length - 1].name)
                }
              }}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="Clear single product"
            >
              <X size={14} />
              <span>Clear One</span>
            </button>
          )}

          <button
            onClick={clearCompare}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-xs font-semibold flex items-center gap-1.5"
            title="Clear all products from comparison"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* Comparison Table / Matrix */}
      <div className="card overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Header: Products */}
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <th className="p-4 sm:p-5 font-bold uppercase tracking-wider text-[11px] text-zinc-400 w-44 sm:w-56 shrink-0 align-top">
                  Product Details
                </th>
                {items.map((item) => (
                  <th key={item.id} className="p-4 sm:p-5 min-w-[220px] max-w-[280px] align-top relative">
                    <div className="absolute top-4 left-4 flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds((p) => [...p, item.id])
                          else setSelectedIds((p) => p.filter((x) => x !== item.id))
                        }}
                        className="rounded border-zinc-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                        title="Select product to clear"
                      />
                    </div>
                    <button
                      onClick={() => handleClearOne(item.id, item.name)}
                      className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove product"
                    >
                      <X size={15} />
                    </button>
                    <div className="space-y-3">
                      <div className="relative aspect-square w-28 h-28 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden p-2">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          {item.brand}
                        </span>
                        <Link
                          href={`/shop/${item.slug}`}
                          className="font-bold text-sm text-zinc-900 dark:text-white hover:text-brand-600 line-clamp-2 transition-colors"
                        >
                          {item.name}
                        </Link>
                      </div>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="btn-primary w-full py-2 text-xs font-semibold justify-center gap-1.5"
                      >
                        <ShoppingBag size={13} /> Add to Cart
                      </button>
                    </div>
                  </th>
                ))}

                {/* Empty slots placeholders */}
                {Array.from({ length: 4 - items.length }).map((_, idx) => (
                  <th key={`slot-${idx}`} className="p-4 sm:p-5 min-w-[200px] align-middle text-center bg-zinc-50/30 dark:bg-zinc-950/20">
                    <button
                      onClick={() => setPickerOpen(true)}
                      className="w-full py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-brand-600 hover:border-brand-300 dark:hover:border-brand-700 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-brand-50 flex items-center justify-center transition-colors">
                        <Plus size={18} />
                      </div>
                      <span className="text-xs font-bold">Add to Compare</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {/* Row: Price */}
              <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                <td className="p-4 sm:p-5 font-bold text-zinc-600 dark:text-zinc-400">Price</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 sm:p-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-zinc-900 dark:text-white">
                        {formatPrice(item.price)}
                      </span>
                      {item.mrp && item.mrp > item.price && (
                        <span className="text-xs text-zinc-400 line-through">
                          {formatPrice(item.mrp)}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
                {Array.from({ length: 4 - items.length }).map((_, i) => (
                  <td key={i} className="p-4 sm:p-5 text-zinc-300 dark:text-zinc-700">—</td>
                ))}
              </tr>

              {/* Row: Rating */}
              <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                <td className="p-4 sm:p-5 font-bold text-zinc-600 dark:text-zinc-400">Rating & Reviews</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 sm:p-5">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span>{(item.rating ?? 4.8).toFixed(1)}</span>
                      </div>
                    </div>
                  </td>
                ))}
                {Array.from({ length: 4 - items.length }).map((_, i) => (
                  <td key={i} className="p-4 sm:p-5 text-zinc-300 dark:text-zinc-700">—</td>
                ))}
              </tr>

              {/* Row: Category */}
              <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                <td className="p-4 sm:p-5 font-bold text-zinc-600 dark:text-zinc-400">Category</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 sm:p-5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {item.category || "Protein Supplement"}
                    </span>
                  </td>
                ))}
                {Array.from({ length: 4 - items.length }).map((_, i) => (
                  <td key={i} className="p-4 sm:p-5 text-zinc-300 dark:text-zinc-700">—</td>
                ))}
              </tr>

              {/* Row: Stock Status */}
              <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                <td className="p-4 sm:p-5 font-bold text-zinc-600 dark:text-zinc-400">Availability</td>
                {items.map((item) => {
                  const inStock = (item.stock ?? 50) > 0
                  return (
                    <td key={item.id} className="p-4 sm:p-5">
                      {inStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                          <Check size={12} /> In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                          <AlertCircle size={12} /> Out of Stock
                        </span>
                      )}
                    </td>
                  )
                })}
                {Array.from({ length: 4 - items.length }).map((_, i) => (
                  <td key={i} className="p-4 sm:p-5 text-zinc-300 dark:text-zinc-700">—</td>
                ))}
              </tr>

              {/* Row: Protein & Servings */}
              <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                <td className="p-4 sm:p-5 font-bold text-zinc-600 dark:text-zinc-400">Nutritional Highlights</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 sm:p-5 text-zinc-700 dark:text-zinc-300">
                    <p className="line-clamp-3 text-xs leading-relaxed">
                      {item.proteinPerServing
                        ? `${item.proteinPerServing} per scoop • ${item.servings || "30"} servings`
                        : item.shortDescription || "Ultra-filtered premium formula with zero added sugar and instant mixability."}
                    </p>
                  </td>
                ))}
                {Array.from({ length: 4 - items.length }).map((_, i) => (
                  <td key={i} className="p-4 sm:p-5 text-zinc-300 dark:text-zinc-700">—</td>
                ))}
              </tr>

              {/* Row: Authenticity & Guarantee */}
              <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                <td className="p-4 sm:p-5 font-bold text-zinc-600 dark:text-zinc-400">Authenticity</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 sm:p-5 text-zinc-700 dark:text-zinc-300">
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <Check size={13} /> 100% Genuine Direct Import
                    </span>
                  </td>
                ))}
                {Array.from({ length: 4 - items.length }).map((_, i) => (
                  <td key={i} className="p-4 sm:p-5 text-zinc-300 dark:text-zinc-700">—</td>
                ))}
              </tr>

              {/* Row: Direct Link */}
              <tr className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                <td className="p-4 sm:p-5 font-bold text-zinc-600 dark:text-zinc-400">Full Details</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 sm:p-5">
                    <Link
                      href={`/shop/${item.slug}`}
                      className="text-xs font-bold text-brand-600 hover:underline"
                    >
                      View Product Page &rarr;
                    </Link>
                  </td>
                ))}
                {Array.from({ length: 4 - items.length }).map((_, i) => (
                  <td key={i} className="p-4 sm:p-5 text-zinc-300 dark:text-zinc-700">—</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                  Add Product to Comparison
                </h3>
                <p className="text-xs text-zinc-400">
                  Select a product to compare with your current {items.length} items
                </p>
              </div>
              <button
                onClick={() => setPickerOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search products by title or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 text-xs py-2.5"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingCatalog ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  Loading catalog products...
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  No matching products found.
                </div>
              ) : (
                filteredCatalog.map((p) => {
                  const price = p.variants?.[0]?.price ?? p.basePrice
                  const img = p.images?.[0]?.url || "/assets/products/whey.jpg"
                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-brand-500/40 flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-1 shrink-0 overflow-hidden">
                          <Image src={img} alt={p.name} fill className="object-contain" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            {p.brand}
                          </span>
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                            {p.name}
                          </span>
                          <span className="text-xs font-semibold text-brand-600 block mt-0.5">
                            {formatPrice(price)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddFromCatalog(p)}
                        className="btn-primary py-1.5 px-3 text-xs font-bold shrink-0"
                      >
                        + Compare
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

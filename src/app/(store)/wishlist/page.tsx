"use client"

import { useState } from "react"
import { useWishlistStore } from "@/store/wishlist"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { Heart, Trash2, ShoppingCart, ArrowRight, CheckSquare, Square, RotateCcw } from "lucide-react"
import { toast } from "sonner"

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const addItem = useCartStore((s) => s.addItem)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleMoveToCart = (item: any) => {
    const id = item.productId || item.id
    addItem({
      id,
      productId: id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      mrp: item.mrp,
      image: item.image,
      quantity: 1,
      stock: 50,
      slug: item.slug,
    })
    removeItem(id)
    toast.success("Moved to cart!", { description: item.name })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map((i) => i.productId || i.id || ""))
    }
  }

  const handleClearOne = () => {
    if (items.length === 0) return
    const item = items[items.length - 1]
    const id = (item.productId || item.id || "") as string
    if (id) {
      removeItem(id)
      setSelectedIds((prev) => prev.filter((x) => x !== id))
      toast.success(`Removed "${item.name}" from wishlist`)
    }
  }

  const handleClearSelected = () => {
    if (selectedIds.length === 0) {
      handleClearOne()
      return
    }
    const count = selectedIds.length
    selectedIds.forEach((id) => removeItem(id))
    setSelectedIds([])
    toast.success(`Removed ${count} selected item${count > 1 ? "s" : ""} from wishlist`)
  }

  return (
    <div className="min-h-screen py-10 bg-zinc-50 dark:bg-zinc-950">
      <div className="container-custom max-w-5xl">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Header with Clear All and Clear Selected */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Heart className="fill-rose-500 text-rose-500" size={24} />
                My Wishlist ({items.length})
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Your saved performance supplements and fitness essentials.
              </p>
            </div>

            {items.length > 0 && (
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Select All Toggle */}
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                >
                  {selectedIds.length === items.length ? (
                    <>
                      <CheckSquare size={13} className="text-brand-600" />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <Square size={13} />
                      <span>Select All</span>
                    </>
                  )}
                </button>

                {/* Option to Clear One or Individuals */}
                {selectedIds.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearSelected}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                    title="Remove selected individual items from wishlist"
                  >
                    <Trash2 size={13} />
                    <span>Clear Selected ({selectedIds.length})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearOne}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                    title="Remove one item from wishlist"
                  >
                    <Trash2 size={13} className="text-zinc-500" />
                    <span>Clear One</span>
                  </button>
                )}

                {/* Clear All Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Remove all items from your wishlist?")) {
                      clearWishlist()
                      setSelectedIds([])
                      toast.info("Wishlist cleared")
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Remove all saved products from wishlist"
                >
                  <RotateCcw size={12} />
                  <span>Clear All</span>
                </button>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <Heart size={28} />
              </div>
              <div>
                <p className="text-base font-bold text-zinc-900 dark:text-white">Your wishlist is currently empty</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Explore our top-tier isolates, gainers, pre-workouts, and creatine.
                </p>
              </div>
              <Link href="/shop" className="btn-primary text-xs inline-flex items-center gap-2 px-6 py-2.5">
                Browse Supplements <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {items.map((item) => {
                const id = item.productId || item.id || ""
                const isSelected = selectedIds.includes(id)
                return (
                  <div
                    key={id}
                    className={`group bg-white dark:bg-zinc-800/80 border rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all relative ${
                      isSelected
                        ? "border-brand-500 ring-2 ring-brand-500/30"
                        : "border-zinc-200 dark:border-zinc-700/80"
                    }`}
                  >
                    {/* Item Selection Checkbox (for clearing individuals) */}
                    <div className="absolute top-3 left-3 z-20">
                      <button
                        type="button"
                        onClick={() => toggleSelect(id)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shadow-sm ${
                          isSelected
                            ? "bg-brand-600 border-brand-600 text-white"
                            : "bg-white/90 dark:bg-zinc-900/90 border-zinc-300 dark:border-zinc-600 text-transparent hover:border-zinc-400"
                        }`}
                        title={isSelected ? "Unselect item" : "Select item to clear"}
                      >
                        <CheckSquare size={13} className={isSelected ? "text-white" : "opacity-0"} />
                      </button>
                    </div>

                    <div>
                      <div className="relative aspect-square rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 overflow-hidden mb-3 border border-zinc-100 dark:border-zinc-700/50 flex items-center justify-center">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">{item.brand}</p>
                      <Link
                        href={`/shop/${item.slug}`}
                        className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mt-0.5"
                      >
                        {item.name}
                      </Link>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-sm font-black text-zinc-900 dark:text-white">
                          {formatPrice(item.price)}
                        </span>
                        {item.mrp && item.mrp > item.price && (
                          <span className="text-xs text-zinc-400 line-through">
                            {formatPrice(item.mrp)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-700/80">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="btn-primary flex-1 py-2 text-xs justify-center gap-1.5 rounded-xl font-bold"
                      >
                        <ShoppingCart size={13} /> Add to Cart
                      </button>

                      {/* Direct Individual Clear Button */}
                      <button
                        onClick={() => {
                          removeItem(id)
                          setSelectedIds((prev) => prev.filter((x) => x !== id))
                          toast.info("Removed individual item from wishlist")
                        }}
                        title="Clear this individual item"
                        className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-900 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

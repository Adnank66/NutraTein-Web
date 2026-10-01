"use client"

import { useState } from "react"
import { useWishlistStore } from "@/store/wishlist"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { Heart, Trash2, ShoppingCart, CheckSquare, Square, RotateCcw } from "lucide-react"
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
    <div className="card p-6 space-y-6 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-dark-100 dark:border-zinc-800 gap-3">
        <div>
          <h1 className="text-xl font-bold text-dark-900 dark:text-white">My Wishlist ({items.length})</h1>
          <p className="text-xs text-dark-500 dark:text-zinc-400 mt-0.5">Products you have saved for later purchase.</p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 ? (
              <button
                type="button"
                onClick={handleClearSelected}
                className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
                title="Clear selected individual items"
              >
                <Trash2 size={13} />
                <span>Clear Selected ({selectedIds.length})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearOne}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors"
                title="Clear one item from wishlist"
              >
                <Trash2 size={13} className="text-zinc-500" />
                <span>Clear One</span>
              </button>
            )}

            <button
              onClick={() => {
                if (confirm("Remove all items from your wishlist?")) {
                  clearWishlist()
                  setSelectedIds([])
                  toast.info("Wishlist cleared")
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
              title="Clear all saved products"
            >
              <RotateCcw size={12} />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto text-red-400">
            <Heart size={20} />
          </div>
          <p className="text-sm font-bold text-dark-900 dark:text-white">Your wishlist is empty</p>
          <Link href="/shop" className="btn-primary text-xs inline-flex">
            Browse Supplements
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => {
            const id = (item.productId || item.id || "") as string
            const isSelected = selectedIds.includes(id)
            return (
              <div
                key={id}
                className={`card p-4 border bg-white dark:bg-zinc-800/80 flex flex-col justify-between relative transition-all ${
                  isSelected
                    ? "border-brand-500 ring-2 ring-brand-500/30"
                    : "border-dark-100 dark:border-zinc-800"
                }`}
              >
                {/* Checkbox for individual selection */}
                <div className="absolute top-3 left-3 z-10">
                  <button
                    type="button"
                    onClick={() => toggleSelect(id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-xs ${
                      isSelected
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400"
                    }`}
                    title="Select to clear"
                  >
                    <CheckSquare size={12} className={isSelected ? "text-white" : "opacity-0"} />
                  </button>
                </div>

                <div>
                  <div className="relative aspect-square rounded-xl bg-dark-50 dark:bg-zinc-900/60 overflow-hidden mb-3">
                    <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
                  </div>
                  <p className="text-[10px] font-bold text-brand-600 uppercase">{item.brand}</p>
                  <Link href={`/shop/${item.slug}`} className="text-xs font-bold text-dark-900 dark:text-zinc-100 line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400">
                    {item.name}
                  </Link>
                  <p className="text-sm font-extrabold text-dark-900 dark:text-white mt-2">{formatPrice(item.price)}</p>
                </div>

                <div className="flex gap-2 pt-3 mt-3 border-t border-dark-100 dark:border-zinc-700/80">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="btn-primary flex-1 py-1.5 text-xs justify-center gap-1"
                  >
                    <ShoppingCart size={12} /> Add to Cart
                  </button>
                  <button
                    onClick={() => {
                      removeItem(id)
                      setSelectedIds((prev) => prev.filter((x) => x !== id))
                      toast.info("Removed item from wishlist")
                    }}
                    title="Clear this individual item"
                    className="p-2 border border-dark-200 dark:border-zinc-700 rounded-lg text-dark-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
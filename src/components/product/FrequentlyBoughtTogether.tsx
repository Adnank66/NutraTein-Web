"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Check, ShoppingBag, Sparkles } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { toast } from "sonner"

interface FrequentlyBoughtTogetherProps {
  currentProduct: {
    id: string
    slug: string
    name: string
    brand: string
    price: number
    mrp: number
    image: string
    stock?: number
  }
}

export default function FrequentlyBoughtTogether({ currentProduct }: FrequentlyBoughtTogetherProps) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const [bundleItem, setBundleItem] = useState<any>(null)
  const [includeMain, setIncludeMain] = useState(true)
  const [includeBundle, setIncludeBundle] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/ai/recommendations?context=product&slug=${currentProduct.slug}&productId=${currentProduct.id}&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.recommendations?.length > 0) {
          setBundleItem(data.recommendations[0])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentProduct.id, currentProduct.slug])

  if (loading || !bundleItem) return null

  const itemsToBuy = [
    ...(includeMain ? [currentProduct] : []),
    ...(includeBundle ? [bundleItem] : []),
  ]

  const totalPrice = itemsToBuy.reduce((sum, item) => sum + item.price, 0)
  const totalMrp = itemsToBuy.reduce((sum, item) => sum + (item.mrp || item.price), 0)
  const totalSavings = totalMrp - totalPrice

  const handleAddBundleToCart = () => {
    if (itemsToBuy.length === 0) return

    for (const item of itemsToBuy) {
      addItem({
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
    }

    toast.success(`Added ${itemsToBuy.length} items to cart!`)
    openCart()
  }

  return (
    <div className="card p-6 sm:p-8 bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-brand-600/10 text-brand-600 flex items-center justify-center">
          <Sparkles size={16} />
        </div>
        <div>
          <h3 className="font-display text-lg font-black text-zinc-900 dark:text-white">
            Frequently Bought Together
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {bundleItem.recommendationReason || "Athletic Stack Synergy"}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2">
        {/* Visual Pair */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-1">
          {/* Main Item */}
          <div className="relative group">
            <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-zinc-800 p-2 border transition-all ${
              includeMain ? "border-brand-500/50 shadow-md" : "border-zinc-200 dark:border-zinc-700 opacity-50"
            }`}>
              <Image
                src={currentProduct.image}
                alt={currentProduct.name}
                fill
                className="object-contain p-2"
              />
            </div>
            <span className="badge-dark text-[9px] absolute -top-2 left-2">THIS ITEM</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Plus size={16} />
          </div>

          {/* Bundle Item */}
          <div className="relative group">
            <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-zinc-800 p-2 border transition-all ${
              includeBundle ? "border-brand-500/50 shadow-md" : "border-zinc-200 dark:border-zinc-700 opacity-50"
            }`}>
              <Image
                src={bundleItem.image}
                alt={bundleItem.name}
                fill
                className="object-contain p-2"
              />
            </div>
            <span className="badge-brand text-[9px] absolute -top-2 left-2">PAIRED</span>
          </div>
        </div>

        {/* Checkboxes & Pricing CTA */}
        <div className="w-full lg:w-auto lg:min-w-[320px] space-y-4">
          <div className="space-y-2 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeMain}
                onChange={(e) => setIncludeMain(e.target.checked)}
                className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white line-clamp-1">
                <strong>This item:</strong> {currentProduct.name} (
                <span className="font-bold text-zinc-900 dark:text-white">{formatPrice(currentProduct.price)}</span>
                )
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeBundle}
                onChange={(e) => setIncludeBundle(e.target.checked)}
                className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white line-clamp-1">
                <strong>Add:</strong> {bundleItem.name} (
                <span className="font-bold text-zinc-900 dark:text-white">{formatPrice(bundleItem.price)}</span>
                )
              </span>
            </label>
          </div>

          <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-zinc-900 dark:text-white">
                  {formatPrice(totalPrice)}
                </span>
                {totalSavings > 0 && (
                  <span className="text-xs text-zinc-400 line-through">
                    {formatPrice(totalMrp)}
                  </span>
                )}
              </div>
              {totalSavings > 0 && (
                <p className="text-[11px] font-bold text-emerald-600">
                  Save {formatPrice(totalSavings)} on this stack
                </p>
              )}
            </div>

            <button
              onClick={handleAddBundleToCart}
              disabled={itemsToBuy.length === 0}
              className="btn-primary py-2.5 px-5 text-xs font-bold justify-center gap-1.5 shadow-md shadow-brand-500/20 disabled:opacity-40"
            >
              <ShoppingBag size={14} /> Add {itemsToBuy.length > 1 ? "Both" : "Selected"} to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Sparkles, Plus, Check } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { toast } from "sonner"

export default function CartRecommendations() {
  const { items, addItem } = useCartStore()
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (items.length === 0) {
      setRecommendations([])
      return
    }

    const cartIds = items.map((i) => i.productId).join(",")
    setLoading(true)

    fetch(`/api/ai/recommendations?context=cart&cartProductIds=${cartIds}&limit=2`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.recommendations) {
          setRecommendations(data.recommendations)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [items])

  if (items.length === 0 || (!loading && recommendations.length === 0)) {
    return null
  }

  const handleQuickAdd = (rec: any) => {
    addItem({
      id: rec.id,
      productId: rec.id,
      name: rec.name,
      brand: rec.brand,
      price: rec.price,
      mrp: rec.mrp,
      image: rec.image,
      quantity: 1,
      stock: rec.stock ?? 50,
      slug: rec.slug,
    })
    setAddedIds((prev) => ({ ...prev, [rec.id]: true }))
    toast.success("Added to cart", { description: rec.name })
  }

  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 bg-transparent">
      <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
        <Sparkles size={13} className="text-brand-600 dark:text-brand-400" />
        <span>Frequently Paired Add-ons</span>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec) => {
          const isAdded = addedIds[rec.id]
          return (
            <div
              key={rec.id}
              className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-11 h-11 rounded-lg bg-zinc-50 dark:bg-zinc-800 p-1 shrink-0 overflow-hidden">
                  <Image src={rec.image} alt={rec.name} fill className="object-contain" />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/shop/${rec.slug}`}
                    className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate block hover:text-brand-600"
                  >
                    {rec.name}
                  </Link>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      {formatPrice(rec.price)}
                    </span>
                    {rec.mrp > rec.price && (
                      <span className="text-[10px] text-zinc-400 line-through">
                        {formatPrice(rec.mrp)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleQuickAdd(rec)}
                disabled={isAdded}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                  isAdded
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-brand-600 dark:hover:bg-brand-500"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check size={12} /> Added
                  </>
                ) : (
                  <>
                    <Plus size={12} /> Add
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

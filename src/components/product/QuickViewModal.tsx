"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { X, Star, ShoppingBag, ShieldCheck, ArrowRight } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { toast } from "sonner"

interface QuickViewModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    slug: string
    brand: string
    price: number
    mrp: number
    discountPercent?: number
    rating: number
    reviewCount: number
    image: string
    flavor?: string
    size?: string
    stock: number
  } | null
}

export default function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)

  if (!isOpen || !product) return null

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      quantity,
      flavor: product.flavor,
      size: product.size,
      stock: product.stock,
      slug: product.slug,
    })
    toast.success("Added to cart", {
      description: `${quantity}x ${product.name}`,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="relative bg-zinc-100/70 dark:bg-zinc-800/60 flex items-center justify-center p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-zinc-200 dark:border-zinc-700 min-h-[240px]">
            <div className="relative w-full h-56 sm:h-72">
              <Image src={product.image} alt={product.name} fill className="object-contain p-1" priority />
            </div>
            {product.discountPercent && product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 badge-orange font-bold text-xs">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">{product.brand}</span>
              <h2 className="text-lg font-bold text-zinc-900 mt-1 leading-snug">{product.name}</h2>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md text-amber-700 text-xs font-bold">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-zinc-400">({product.reviewCount} verified ratings)</span>
              </div>

              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-black text-zinc-900">{formatPrice(product.price)}</span>
                {product.mrp > product.price && (
                  <span className="text-xs text-zinc-400 line-through">{formatPrice(product.mrp)}</span>
                )}
              </div>

              {(product.flavor || product.size) && (
                <div className="mt-2.5 text-xs text-zinc-600">
                  <span className="font-semibold text-zinc-900">Selected: </span>
                  <span>{[product.flavor, product.size].filter(Boolean).join(" • ")}</span>
                </div>
              )}

              <div className="mt-2.5 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                <ShieldCheck size={14} />
                <span>In Stock • Ready for Express Dispatch</span>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-zinc-100">
              <button
                onClick={handleAddToCart}
                className="btn-primary w-full py-2.5 text-xs font-bold justify-center"
              >
                <ShoppingBag size={14} /> Add to Cart
              </button>
              <Link
                href={`/shop/${product.slug}`}
                onClick={onClose}
                className="btn-secondary w-full py-2 text-xs font-semibold justify-center"
              >
                View Full Specifications <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
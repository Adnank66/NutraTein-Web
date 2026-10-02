"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Star, ShoppingBag, Eye, ArrowLeftRight } from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { useWishlistStore } from "@/store/wishlist"
import { useCompareStore } from "@/store/compare"
import { toast } from "sonner"
import QuickViewModal from "./QuickViewModal"
import AnimatedButton from "@/components/ui/animated-button"

interface ProductCardProps {
  id: string
  slug: string
  name: string
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
  isBestSeller?: boolean
  isNew?: boolean
  variantId?: string
  shortDescription?: string
  category?: string
}

export default function ProductCard({
  id,
  slug,
  name,
  brand,
  price,
  mrp,
  discountPercent,
  rating,
  reviewCount,
  image,
  flavor,
  size,
  stock,
  isBestSeller,
  isNew,
  variantId,
  shortDescription,
  category,
}: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const { isInWishlist, toggleWishlist } = useWishlistStore()
  const wishlisted = isInWishlist(id)
  const { isInCompare, toggleCompare } = useCompareStore()
  const compared = isInCompare(id)

  const cardRef = useRef<HTMLDivElement>(null)
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({})
  const [text3dStyle, setText3dStyle] = useState<React.CSSProperties>({})
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
      setPrefersReducedMotion(mq.matches)
    }
  }, [])

  // Desktop Mouse Tilt & Zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || prefersReducedMotion) return
    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    const x = e.clientX - left
    const y = e.clientY - top

    const rotateX = ((y - height / 2) / (height / 2)) * -8
    const rotateY = ((x - width / 2) / (width / 2)) * 8

    setTiltStyle({
      transform: `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.035, 1.035, 1.035)`,
      transition: "transform 0.08s ease-out",
    })
    setText3dStyle({
      transform: `translateZ(22px) rotateX(${(rotateX * 0.6).toFixed(2)}deg) rotateY(${(rotateY * 0.6).toFixed(2)}deg)`,
      transition: "transform 0.08s ease-out",
    })
  }

  const handleMouseLeave = () => {
    if (prefersReducedMotion) return
    setTiltStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
    })
    setText3dStyle({
      transform: "translateZ(0px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
    })
  }

  // Mobile / Touch Finger Rotation & Zoom-In / Zoom-Out
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || prefersReducedMotion || !e.touches[0]) return
    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - left
    const y = touch.clientY - top

    const normX = Math.max(-1, Math.min(1, (x - width / 2) / (width / 2)))
    const normY = Math.max(-1, Math.min(1, (y - height / 2) / (height / 2)))

    const rotateX = -normY * 10
    const rotateY = normX * 10

    setTiltStyle({
      transform: `perspective(850px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.045, 1.045, 1.045)`,
      transition: "transform 0.12s ease-out",
    })
    setText3dStyle({
      transform: `translateZ(26px) rotateX(${(-normY * 8).toFixed(2)}deg) rotateY(${(normX * 8).toFixed(2)}deg)`,
      transition: "transform 0.12s ease-out",
    })
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || prefersReducedMotion || !e.touches[0]) return
    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - left
    const y = touch.clientY - top

    const normX = Math.max(-1, Math.min(1, (x - width / 2) / (width / 2)))
    const normY = Math.max(-1, Math.min(1, (y - height / 2) / (height / 2)))

    const rotateX = -normY * 11
    const rotateY = normX * 11

    setTiltStyle({
      transform: `perspective(850px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.045, 1.045, 1.045)`,
      transition: "transform 0.06s ease-out",
    })
    setText3dStyle({
      transform: `translateZ(26px) rotateX(${(-normY * 9).toFixed(2)}deg) rotateY(${(normX * 9).toFixed(2)}deg)`,
      transition: "transform 0.06s ease-out",
    })
  }

  const handleTouchEnd = () => {
    if (prefersReducedMotion) return
    setTiltStyle({
      transform: "perspective(850px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
    })
    setText3dStyle({
      transform: "translateZ(0px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
    })
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      id: variantId || id,
      productId: id,
      name,
      brand,
      price,
      mrp,
      image,
      quantity: 1,
      flavor,
      size,
      stock,
      slug,
    })
    toast.success("Added to cart", {
      description: name,
    })
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist({
      productId: id,
      name,
      brand,
      price,
      mrp,
      image,
      slug,
      rating,
    })
    toast(wishlisted ? "Removed from Wishlist" : "Saved to Wishlist", {
      description: name,
    })
  }

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const added = toggleCompare({
      id,
      name,
      brand,
      price,
      mrp,
      image,
      slug,
      rating,
      category,
      stock,
      shortDescription,
    })
    toast(added ? "Added to comparison" : "Removed from comparison", {
      description: name,
      action: {
        label: "Compare Now",
        onClick: () => {
          window.location.href = "/compare"
        },
      },
    })
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setQuickViewOpen(true)
  }

  return (
    <>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={tiltStyle}
        className="group card flex flex-col justify-between overflow-hidden bg-white dark:bg-zinc-900 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-300/40 dark:hover:shadow-zinc-950/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 [transform-style:preserve-3d] will-change-transform touch-pan-y"
      >
        <div>
          {/* Image container — fixed aspect, fills card edge to edge */}
          <div className="relative w-full aspect-square bg-zinc-100/70 dark:bg-zinc-800/50 overflow-hidden">
            <Link href={`/shop/${slug}`} className="relative w-full h-full block">
              <Image
                src={image}
                alt={name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </Link>

            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {isBestSeller && <span className="badge-dark text-[9px] sm:text-[10px]">BEST</span>}
              {isNew && <span className="badge-brand text-[9px] sm:text-[10px]">NEW</span>}
              {discountPercent && discountPercent > 0 ? (
                <span className="badge-orange text-[9px] sm:text-[10px]">{discountPercent}% OFF</span>
              ) : null}
              {stock > 0 && stock <= 15 && (
                <span className="badge-red text-[9px] sm:text-[10px]">LOW</span>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={handleWishlistToggle}
              className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:border-rose-200 transition-all duration-200 active:scale-90"
              aria-label="Wishlist"
            >
              <Heart
                size={14}
                className={cn(
                  "transition-all duration-200",
                  wishlisted ? "fill-rose-500 text-rose-500 scale-110" : "hover:scale-110"
                )}
              />
            </button>

            {/* Quick View — desktop only */}
            <button
              onClick={handleQuickView}
              className="absolute bottom-2 inset-x-2 py-1 rounded-lg bg-white/95 text-zinc-800 text-[11px] font-semibold shadow-sm border border-zinc-200/80 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 items-center justify-center gap-1 hidden sm:flex active:scale-[0.97]"
            >
              <Eye size={12} /> Quick View
            </button>
          </div>

          {/* Text content */}
          <div className="p-2 sm:p-4 space-y-1 transition-transform duration-100 [transform-style:preserve-3d] will-change-transform" style={text3dStyle}>
            <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{brand}</span>
            <Link
              href={`/shop/${slug}`}
              className="font-bold text-[11px] sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 line-clamp-2 leading-snug transition-colors duration-200 block"
            >
              {name}
            </Link>

            <div className="flex items-center gap-1 pt-0.5">
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-1 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/60">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <span>{rating.toFixed(1)}</span>
              </div>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">({reviewCount})</span>
            </div>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="px-2 sm:px-4 pb-2 sm:pb-4 pt-0 transition-transform duration-100 [transform-style:preserve-3d] will-change-transform" style={text3dStyle}>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-sm sm:text-lg font-black text-zinc-900 dark:text-white">{formatPrice(price)}</span>
            {mrp > price && (
              <span className="text-[10px] text-zinc-400 line-through">{formatPrice(mrp)}</span>
            )}
          </div>

          {/* Add to Cart */}
          <AnimatedButton
            onClick={handleAddToCart}
            accentColor="bg-red-600"
            className="w-full py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold justify-center gap-1 bg-gradient-to-r from-brand-600 to-orange-500 text-white border-none shadow-sm hover:border-none rounded-lg sm:rounded-xl"
            innerClassName="gap-1 text-white"
          >
            <ShoppingBag size={12} /> Add to Cart
          </AnimatedButton>
        </div>
      </div>

      <QuickViewModal
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        product={{
          id,
          name,
          slug,
          brand,
          price,
          mrp,
          discountPercent,
          rating,
          reviewCount,
          image,
          flavor,
          size,
          stock,
        }}
      />
    </>
  )
}
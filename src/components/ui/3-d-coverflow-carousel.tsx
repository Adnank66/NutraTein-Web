"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Heart,
  GitCompare,
  ArrowRight,
  Star,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Flame,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { useWishlistStore } from "@/store/wishlist"
import RevealText from "@/components/ui/reveal-text"
import { useCompareStore } from "@/store/compare"
import { getCoverflowCatalogProducts } from "@/data/products-catalog"

export interface ProductVariantItem {
  id?: string
  _id?: string
  weight?: string
  size?: string
  flavor?: string
  servings?: number | string
  price: number
  originalPrice?: number
  mrp?: number
  discount?: number
  stock?: number
  sku?: string
  status?: string
  image?: string
  isDefault?: boolean
}

export interface ProductCardItem {
  id: string
  name: string
  brand?: string
  category?: string
  flavor?: string
  weight?: string
  description?: string

  image: string
  images?: string[]

  price: number
  originalPrice?: number
  discount?: number

  rating?: number
  reviewCount?: number

  proteinPerServing?: string
  servings?: string

  stock?: number
  stockStatus?: string

  badge?: string

  variants?: ProductVariantItem[]

  href?: string
  slug?: string
}

export interface CoverflowCarouselProps {
  products?: ProductCardItem[]
  title?: string
  subtitle?: string
  badgeText?: string
  autoplay?: boolean
  autoplayDelay?: number
  className?: string
  onProductClick?: (product: ProductCardItem) => void
}

const DEFAULT_PRODUCTS: ProductCardItem[] = getCoverflowCatalogProducts()

export default function CoverflowCarousel({
  products = DEFAULT_PRODUCTS,
  title = "FEATURED PRODUCTS",
  subtitle = "Premium sports nutrition engineered for peak athletic performance and rapid recovery.",
  badgeText = "ELITE PERFORMANCE FORMULAS",
  autoplay = true,
  autoplayDelay = 4500,
  className = "",
  onProductClick
}: CoverflowCarouselProps) {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({})
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [activeTabCategory, setActiveTabCategory] = useState<string>("ALL")

  // Cart & Wishlist stores
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const { isInWishlist, toggleWishlist } = useWishlistStore()
  const { isInCompare, toggleCompare } = useCompareStore()

  // Filter products by category if tabs used
  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))]
  const filteredProducts = activeTabCategory === "ALL"
    ? products
    : products.filter((p) => p.category === activeTabCategory)

  const items = filteredProducts.length > 0 ? filteredProducts : products
  const count = items.length

  // Touch Swipe tracking
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
      setPrefersReducedMotion(mediaQuery.matches)
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [])

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? count - 1 : prev - 1))
  }, [count])

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev === count - 1 ? 0 : prev + 1))
  }, [count])

  // Autoplay loop
  useEffect(() => {
    if (!autoplay || isPaused || count <= 1) return

    const timer = setInterval(() => {
      handleNext()
    }, autoplayDelay)

    return () => clearInterval(timer)
  }, [autoplay, autoplayDelay, isPaused, count, handleNext])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (containerRef.current && containerRef.current.contains(document.activeElement)) {
        if (e.key === "ArrowLeft") {
          e.preventDefault()
          handlePrev()
        } else if (e.key === "ArrowRight") {
          e.preventDefault()
          handleNext()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleNext, handlePrev])

  // Mobile Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true)
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    setIsPaused(false)
    if (!touchStartX.current || !touchEndX.current) return
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      handleNext()
    } else if (isRightSwipe) {
      handlePrev()
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  // Cart & Wishlist Actions (With Multi-Variant Support)
  const handleAddToCart = (e: React.MouseEvent, product: ProductCardItem) => {
    e.preventDefault()
    e.stopPropagation()

    const vIdx = selectedVariants[product.id] ?? 0
    const variant = product.variants && product.variants.length > vIdx ? product.variants[vIdx] : null
    const itemPrice = variant ? variant.price : product.price
    const itemMrp = variant ? (variant.originalPrice || variant.mrp || Math.round(variant.price * 1.3)) : (product.originalPrice || product.price)
    const itemSize = variant ? (variant.weight || variant.size) : product.weight
    const itemFlavor = variant?.flavor || product.flavor
    const itemSku = variant?.sku
    const variantId = variant?.id || (variant as any)?._id || (variant ? `${product.id}-v${vIdx}` : undefined)

    addItem({
      id: variantId ? `${product.id}-${variantId}` : product.id,
      productId: product.id,
      name: product.name,
      brand: product.brand || "NUTRATEIN",
      price: itemPrice,
      mrp: itemMrp,
      image: variant?.image || product.image,
      quantity: 1,
      flavor: itemFlavor,
      size: itemSize,
      stock: (variant?.stock !== undefined ? variant.stock : product.stock) ?? 50,
      slug: product.slug || product.id
    })

    toast.success("Added to cart", {
      description: `${product.name} ${itemSize ? `(${itemSize})` : ""}`,
      icon: <ShoppingCart className="w-4 h-4 text-brand-600" />
    })
    openCart()
  }

  const handleBuyNow = (e: React.MouseEvent, product: ProductCardItem) => {
    e.preventDefault()
    e.stopPropagation()

    const vIdx = selectedVariants[product.id] ?? 0
    const variant = product.variants && product.variants.length > vIdx ? product.variants[vIdx] : null
    const itemPrice = variant ? variant.price : product.price
    const itemMrp = variant ? (variant.originalPrice || variant.mrp || Math.round(variant.price * 1.3)) : (product.originalPrice || product.price)
    const itemSize = variant ? (variant.weight || variant.size) : product.weight
    const itemFlavor = variant?.flavor || product.flavor
    const itemSku = variant?.sku
    const variantId = variant?.id || (variant as any)?._id || (variant ? `${product.id}-v${vIdx}` : undefined)

    addItem({
      id: variantId ? `${product.id}-${variantId}` : product.id,
      productId: product.id,
      name: product.name,
      brand: product.brand || "NUTRATEIN",
      price: itemPrice,
      mrp: itemMrp,
      image: variant?.image || product.image,
      quantity: 1,
      flavor: itemFlavor,
      size: itemSize,
      stock: (variant?.stock !== undefined ? variant.stock : product.stock) ?? 50,
      slug: product.slug || product.id
    })

    toast.success("Proceeding to checkout", {
      description: `${product.name} ${itemSize ? `(${itemSize})` : ""}`
    })

    router.push("/checkout")
  }

  const handleWishlistToggle = (e: React.MouseEvent, product: ProductCardItem) => {
    e.preventDefault()
    e.stopPropagation()

    toggleWishlist({
      productId: product.id,
      name: product.name,
      brand: product.brand || "NUTRATEIN",
      price: product.price,
      mrp: product.originalPrice || product.price,
      image: product.image,
      slug: product.slug || product.id,
      rating: product.rating || 5
    })

    const wishlisted = isInWishlist(product.id)
    toast(wishlisted ? "Removed from Wishlist" : "Saved to Wishlist ❤️", {
      description: product.name
    })
  }

  const handleCompareToggle = (e: React.MouseEvent, product: ProductCardItem) => {
    e.preventDefault()
    e.stopPropagation()

    const added = toggleCompare({
      id: product.id,
      name: product.name,
      brand: product.brand || "NUTRATEIN",
      price: product.price,
      mrp: product.originalPrice,
      image: product.image,
      slug: product.slug || product.id,
      rating: product.rating,
      category: product.category,
      proteinPerServing: product.proteinPerServing,
      servings: product.servings
    })

    if (added) {
      toast.success("Added to comparison", {
        description: `${product.name} added. View side-by-side specs in Compare.`,
        icon: <GitCompare className="w-4 h-4 text-brand-600" />
      })
    } else {
      toast("Removed from comparison", {
        description: product.name
      })
    }
  }

  const handleCardClick = (product: ProductCardItem, index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index)
    } else {
      if (onProductClick) {
        onProductClick(product)
      } else {
        const dest = product.href || `/shop/${product.slug || product.id}`
        router.push(dest)
      }
    }
  }

  // Calculate circular offset distance for coverflow geometry
  const getOffset = (index: number) => {
    let diff = index - activeIndex
    if (diff > count / 2) diff -= count
    if (diff < -count / 2) diff += count
    return diff
  }

  const activeProduct = items[activeIndex] || items[0]

  return (
    <section
      ref={containerRef}
      tabIndex={0}
      aria-label="3D Featured Supplement Carousel"
      className={`relative w-full py-16 sm:py-24 overflow-hidden select-none transition-colors duration-300 focus:outline-none ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Ambient Background Aura */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden transition-opacity duration-700"
        aria-hidden="true"
      >
        <div className="w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full bg-gradient-to-tr from-brand-500/15 via-amber-500/10 to-orange-500/20 blur-[100px] sm:blur-[140px] transform scale-110 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50/80 dark:bg-brand-950/50 border border-brand-200/80 dark:border-brand-800/60 mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-brand-700 dark:text-brand-300">
              {badgeText}
            </span>
          </div>
          <RevealText
            text={title}
            as="h2"
            size="custom"
            duration={0.35}
            stagger={0.02}
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 dark:text-white uppercase !justify-center !text-center"
          />
          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
            {subtitle}
          </p>

          {/* Category Filter Tabs */}
          {categories.length > 2 && (
            <div className="mt-6 flex items-center justify-center gap-1.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveTabCategory(cat)
                    setActiveIndex(0)
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    activeTabCategory === cat
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md scale-105"
                      : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3D Coverflow Stage */}
        <div className="relative w-full h-[620px] sm:h-[660px] flex items-center justify-center [perspective:1200px]">
          {items.map((product, index) => {
            const offset = getOffset(index)
            const isActive = offset === 0
            const isPrev = offset === -1
            const isNext = offset === 1
            const isVisible = Math.abs(offset) <= 1

            if (!isVisible) return null

            // 3D positioning styles
            const transformStyle = prefersReducedMotion
              ? {
                  transform: `translateX(${offset * 105}%) scale(${isActive ? 1 : 0.9})`,
                  zIndex: isActive ? 30 : 10,
                  opacity: isActive ? 1 : 0.4
                }
              : {
                  transform: isActive
                    ? "translateX(0%) scale(1) rotateY(0deg) translateZ(0px)"
                    : offset < 0
                    ? "translateX(-64%) scale(0.84) rotateY(26deg) translateZ(-90px)"
                    : "translateX(64%) scale(0.84) rotateY(-26deg) translateZ(-90px)",
                  zIndex: isActive ? 30 : 20 - Math.abs(offset),
                  opacity: isActive ? 1 : 0.72,
                  filter: isActive ? "brightness(1)" : "brightness(0.75)"
                }

            const isWishlisted = isInWishlist(product.id)
            const isCompared = isInCompare(product.id)
            const hasImageError = imageErrors[product.id]

            const vIdx = selectedVariants[product.id] ?? 0
            const activeVariant = product.variants && product.variants.length > vIdx ? product.variants[vIdx] : null

            const displayPrice = activeVariant ? activeVariant.price : product.price
            const displayOriginalPrice = activeVariant ? (activeVariant.originalPrice || activeVariant.mrp) : product.originalPrice
            const displayDiscount = activeVariant?.discount !== undefined ? activeVariant.discount : product.discount
            const displayWeight = activeVariant ? (activeVariant.weight || activeVariant.size) : product.weight
            const displayFlavor = activeVariant?.flavor || product.flavor
            const displayServings = activeVariant?.servings
              ? (typeof activeVariant.servings === "number" ? `${activeVariant.servings} Servings` : String(activeVariant.servings))
              : product.servings
            const displayStock = activeVariant?.stock !== undefined ? activeVariant.stock : (product.stock ?? 50)
            const displayImage = hasImageError ? "/assets/products/nutratein-placeholder.svg" : (activeVariant?.image || product.image)

            return (
              <div
                key={product.id}
                onClick={() => handleCardClick(product, index)}
                style={{
                  ...transformStyle,
                  transition: "transform 900ms cubic-bezier(0.25, 1, 0.5, 1), opacity 900ms cubic-bezier(0.25, 1, 0.5, 1), filter 900ms cubic-bezier(0.25, 1, 0.5, 1)"
                }}
                className={`absolute w-[320px] sm:w-[380px] lg:w-[410px] rounded-3xl p-5 sm:p-6 cursor-pointer select-none transition-shadow will-change-transform ${
                  isActive
                    ? "bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl border-2 border-brand-500/50 shadow-2xl shadow-brand-500/20 ring-1 ring-brand-500/30"
                    : "bg-white/80 dark:bg-zinc-900/75 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                {/* Card Top Strip: Badges + Wishlist & Compare */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {product.badge && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-600 text-white shadow-sm">
                        <Flame className="w-3 h-3 fill-white" />
                        {product.badge}
                      </span>
                    )}
                    {displayDiscount !== undefined && displayDiscount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {displayDiscount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Micro Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleCompareToggle(e, product)}
                      aria-label="Compare Product"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCompared
                          ? "bg-brand-500 text-white shadow-sm scale-105"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleWishlistToggle(e, product)}
                      aria-label="Save to Wishlist"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isWishlisted
                          ? "bg-rose-50 dark:bg-rose-950/50 text-rose-500 shadow-sm scale-110"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Supplement Tub Container with Backlight Glow */}
                <div className="relative w-full h-[210px] sm:h-[230px] rounded-2xl bg-gradient-to-b from-zinc-50/90 to-zinc-100/50 dark:from-zinc-800/40 dark:to-zinc-900/40 flex items-center justify-center p-3 overflow-hidden border border-zinc-100/80 dark:border-zinc-800/60">
                  {/* Subtle radial spotlight behind tub */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-500/10 via-transparent to-transparent pointer-events-none" />

                  <div className="relative w-full h-full">
                    <Image
                      src={displayImage}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 320px, 410px"
                      priority={isActive}
                      className="object-cover p-0 transition-transform duration-500 group-hover:scale-105"
                      onError={() => {
                        setImageErrors((prev) => ({ ...prev, [product.id]: true }))
                      }}
                    />
                  </div>

                  {/* Quick Pill overlay: Stock */}
                  <div className="absolute bottom-2.5 left-3">
                    {displayStock <= 10 && displayStock > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-sm">
                        <AlertCircle className="w-2.5 h-2.5" /> ONLY {displayStock} LEFT
                      </span>
                    ) : displayStock === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-600 text-white shadow-sm">
                        OUT OF STOCK
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-sm">
                        <Check className="w-2.5 h-2.5" /> IN STOCK
                      </span>
                    )}
                  </div>
                </div>

                {/* Supplement Information & Nutrition Specs */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">
                      {product.brand || "NUTRATEIN"}
                    </span>
                    {/* Rating stars */}
                    {product.rating !== undefined && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          {product.rating.toFixed(1)}
                        </span>
                        {product.reviewCount !== undefined && (
                          <span className="text-[10px] text-zinc-400">({product.reviewCount})</span>
                        )}
                      </div>
                    )}
                  </div>

                  <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white line-clamp-1 leading-snug">
                    {product.name}
                  </h3>

                  {/* Flavor & Size Specs */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {displayFlavor && <span>{displayFlavor}</span>}
                    {displayFlavor && displayWeight && <span>•</span>}
                    {displayWeight && <span className="font-bold text-zinc-700 dark:text-zinc-300">{displayWeight}</span>}
                  </div>

                  {/* Multi-Variant Selection Pills */}
                  {product.variants && product.variants.length > 1 && (
                    <div className="pt-1 pb-0.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
                        Select Variant / Size:
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {product.variants.map((v, idx) => {
                          const isSel = idx === vIdx
                          const pillLabel = v.weight || v.size || (v.servings ? `${v.servings} Servings` : `Option ${idx + 1}`)
                          return (
                            <button
                              key={v.id || v.sku || idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedVariants((prev) => ({ ...prev, [product.id]: idx }))
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all border ${
                                isSel
                                  ? "bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-500/30 scale-105 ring-1 ring-brand-500"
                                  : "bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-brand-500/50"
                              }`}
                            >
                              {pillLabel}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Nutrition Highlights Strip */}
                  <div className="grid grid-cols-2 gap-2 py-1.5 my-1">
                    <div className="px-2.5 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50 text-center">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                        POTENCY
                      </span>
                      <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                        {product.proteinPerServing || "24g Pure Protein"}
                      </span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50 text-center">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                        YIELD
                      </span>
                      <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                        {displayServings || "60 Servings"}
                      </span>
                    </div>
                  </div>

                  {/* Short Description */}
                  {product.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {/* Pricing Strip (Dynamic from selected variant) */}
                  <div className="pt-2 flex items-baseline justify-between border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white">
                        {formatPrice(displayPrice)}
                      </span>
                      {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                        <span className="text-xs text-zinc-400 line-through font-medium">
                          {formatPrice(displayOriginalPrice)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={product.href || `/shop/${product.slug || product.id}`}
                      className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Action Buttons: Add to Cart + Buy Now */}
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={displayStock === 0}
                      className="w-full py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                    <button
                      onClick={(e) => handleBuyNow(e, product)}
                      disabled={displayStock === 0}
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Navigation Controls: Floating Prev/Next Buttons */}
          <button
            onClick={handlePrev}
            aria-label="Previous Product"
            className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-brand-600 dark:hover:text-brand-400 hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Product"
            className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-brand-600 dark:hover:text-brand-400 hover:scale-110 active:scale-95 transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Pagination Dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Jump to product ${idx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                idx === activeIndex
                  ? "w-8 h-2.5 bg-brand-600 shadow-sm"
                  : "w-2.5 h-2.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

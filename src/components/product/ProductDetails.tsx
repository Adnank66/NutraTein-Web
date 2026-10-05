"use client"
import { useState, useEffect, useMemo } from "react"
import {
  Star, ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw,
  Check, Sparkles, AlertCircle, ArrowLeftRight, Flame, Scale
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { useWishlistStore } from "@/store/wishlist"
import { useCompareStore } from "@/store/compare"
import { useTranslation } from "@/hooks/useTranslation"
import { toast } from "sonner"
import ProductGallery from "./ProductGallery"
import ReviewForm from "./ReviewForm"
import RatingStars from "@/components/ui/RatingStars"

interface ProductDetailsProps {
  product: any
}

const FLAVOR_METADATA: Record<string, { color: string; note: string; badge?: string }> = {
  "Swiss Chocolate": { color: "#5D4037", note: "Rich European dark cocoa & velvety cream", badge: "Best Seller" },
  "Cold Coffee": { color: "#6D4C41", note: "Smooth Arabica roast brewed to perfection", badge: "Barista Edition" },
  "Malai Kulfi": { color: "#D7CCC8", note: "Authentic royal cardamom & pistachio blend", badge: "Desi Classic" },
  "Tangy Orange": { color: "#FF6F00", note: "Zesty & energizing citrus kick for max pump", badge: "Citrus Punch" },
  "Fruit Fusion": { color: "#C2185B", note: "Wild berry, kiwi & tropical fruit blast", badge: "Summer Fresh" },
  "Alphonso Mango": { color: "#FFA000", note: "Juicy sun-ripened Ratnagiri mango sweetness", badge: "Seasonal Special" },
  "Northern Delights": { color: "#8D6E63", note: "Creamy butterscotch crunch & roasted almond", badge: "Signature" },
  "Pina Colada": { color: "#FBC02D", note: "Exotic pineapple & crushed coconut splash", badge: "Tropical" },
  "Pineapple": { color: "#FDD835", note: "Crisp natural pineapple tang", badge: "Clean & Crisp" },
  "Unflavoured": { color: "#90A4AE", note: "100% pure raw formula, zero sugar, zero additives", badge: "Pure & Raw" },
}

import { useSession } from "next-auth/react"

export default function ProductDetails({ product }: ProductDetailsProps) {
  const { data: session, status } = useSession()

  // Extract distinct flavors from catalog/product or variants
  const availableFlavors = useMemo(() => {
    const list: string[] = []
    if (Array.isArray(product.flavors) && product.flavors.length > 0) {
      list.push(...product.flavors)
    }
    if (product.flavor && !list.includes(product.flavor)) {
      list.push(product.flavor)
    }
    if (Array.isArray(product.variants)) {
      product.variants.forEach((v: any) => {
        if (v.flavor && !list.includes(v.flavor)) {
          list.push(v.flavor)
        }
      })
    }
    return list.length > 0 ? list : ["Swiss Chocolate"]
  }, [product])

  const [selectedFlavor, setSelectedFlavor] = useState<string>(
    product.flavor || product.variants?.[0]?.flavor || availableFlavors[0]
  )

  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.variants?.[0] || null
  )

  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<"nutrition" | "ingredients" | "usage" | "compare">("nutrition")

  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const { isWishlisted, toggleWishlist } = useWishlistStore()
  const wishlisted = isWishlisted(product.id)
  const { isInCompare, toggleCompare } = useCompareStore()
  const compared = isInCompare(product.id)
  const { t } = useTranslation()

  const currentPrice = selectedVariant?.price ?? product.basePrice
  const currentStock = selectedVariant?.stock ?? 50
  const images = product.images?.map((img: any) => img.url) || ["/assets/products/whey.jpg"]

  // Track recently viewed in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("proteinx_recently_viewed")
      const list = saved ? JSON.parse(saved) : []
      const current = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        price: currentPrice,
        image: images[0],
      }
      const updated = [current, ...list.filter((item: any) => item.id !== product.id)].slice(0, 10)
      localStorage.setItem("proteinx_recently_viewed", JSON.stringify(updated))
    } catch {}
  }, [product.id, currentPrice, images, product.name, product.slug, product.brand])

  // Handle flavor selection
  const handleFlavorSelect = (flavor: string) => {
    setSelectedFlavor(flavor)
    // Check if there is an exact variant matching both flavor and currently chosen size
    if (product.variants && product.variants.length > 0) {
      const currentSize = selectedVariant?.size || selectedVariant?.weight
      const matchingVariant = product.variants.find(
        (v: any) => v.flavor === flavor && (v.size === currentSize || v.weight === currentSize)
      ) || product.variants.find((v: any) => v.flavor === flavor)
      if (matchingVariant) {
        setSelectedVariant(matchingVariant)
      }
    }
  }

  // Handle size selection
  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant)
    if (variant.flavor && availableFlavors.includes(variant.flavor)) {
      setSelectedFlavor(variant.flavor)
    }
  }

  const handleAddToCart = () => {
    if (status === "unauthenticated") {
      toast.error("Please login first to add items to cart")
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      return
    }

    const itemFlavor = selectedFlavor || selectedVariant?.flavor || product.flavor || "Standard"
    const itemSize = selectedVariant?.size || selectedVariant?.weight || "Standard"
    const variantId = selectedVariant?.id
      ? `${selectedVariant.id}-${itemFlavor.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
      : `${product.id}-${itemFlavor.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

    addItem({
      id: variantId,
      productId: product.id,
      name: `${product.name} (${itemFlavor})`,
      brand: product.brand,
      price: currentPrice,
      mrp: product.mrp,
      image: selectedVariant?.image || images[0],
      quantity,
      flavor: itemFlavor,
      size: itemSize,
      stock: currentStock,
      slug: product.slug,
    })
    toast.success("Added to cart", {
      description: `${quantity}x ${product.name} • ${itemFlavor} • ${itemSize}`,
    })
  }

  const handleBuyNow = () => {
    handleAddToCart()
    openCart()
  }

  const handleCompareToggle = () => {
    const added = toggleCompare({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: currentPrice,
      mrp: product.mrp,
      image: images[0],
      slug: product.slug,
      rating: product.rating,
      category: product.category?.name,
      stock: currentStock,
      shortDescription: product.shortDesc,
    })
    toast(added ? "Added to comparison" : "Removed from comparison", {
      description: product.name,
      action: {
        label: "Compare Now",
        onClick: () => {
          window.location.href = "/compare"
        },
      },
    })
  }

  const activeFlavorMeta = FLAVOR_METADATA[selectedFlavor] || {
    color: "#D97706",
    note: "Crafted for rich texture, rapid solubility, and delicious daily nourishment.",
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Top Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
        {/* Left Gallery — sticky only on desktop */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <ProductGallery images={images} productName={product.name} />
        </div>

        {/* Right Info */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
              {product.brand}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white mt-1 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 px-2 py-0.5 rounded-md text-amber-700 dark:text-amber-400 text-xs font-bold">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ({product.reviewCount} customer reviews)
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                ✓ Verified Authentic
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-baseline gap-3">
            <span className="text-3xl font-black text-zinc-950 dark:text-white">{formatPrice(currentPrice)}</span>
            {product.mrp > currentPrice && (
              <>
                <span className="text-sm text-zinc-400 dark:text-zinc-500 line-through">{formatPrice(product.mrp)}</span>
                <span className="badge-orange text-xs font-bold">
                  Save {formatPrice(product.mrp - currentPrice)} ({product.discountPercent}% OFF)
                </span>
              </>
            )}
          </div>

          {/* ── 1. DEDICATED FLAVOUR SELECTION ─────────────────────────── */}
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles size={14} className="text-brand-600 dark:text-brand-400" />
                Select Flavour: <span className="text-brand-600 dark:text-brand-400 normal-case font-black">{selectedFlavor}</span>
              </label>
              {activeFlavorMeta.badge && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  {activeFlavorMeta.badge}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {availableFlavors.map((flavor) => {
                const isSelected = selectedFlavor === flavor
                const meta = FLAVOR_METADATA[flavor]
                return (
                  <button
                    type="button"
                    key={flavor}
                    onClick={() => handleFlavorSelect(flavor)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 group ${
                      isSelected
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-md ring-2 ring-brand-500/30 scale-[1.02]"
                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-100/50 dark:hover:bg-zinc-750"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-black/10 dark:border-white/20 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: meta?.color || "#D97706" }}
                    />
                    <span>{flavor}</span>
                    {isSelected && <Check size={13} className="text-brand-400 dark:text-brand-600 stroke-[3]" />}
                  </button>
                )
              })}
            </div>

            {/* Flavor Tasting Note */}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic pt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
              Tasting Notes: {activeFlavorMeta.note}
            </p>
          </div>

          {/* ── 2. DEDICATED SIZE / PACKAGE WEIGHT SELECTION ────────────── */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                <Scale size={14} className="text-brand-600 dark:text-brand-400" />
                Select Size / Weight Option:
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v: any) => {
                  const isSelected = selectedVariant?.id === v.id
                  const label = v.size || v.weight || "Standard"
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => handleVariantSelect(v)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all text-left ${
                        isSelected
                          ? "bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-500/20"
                          : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-100/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black">{label}</span>
                        {v.servings && (
                          <span className={`text-[10px] ${isSelected ? "text-brand-100" : "text-zinc-400 dark:text-zinc-500"}`}>
                            {v.servings} Servings
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] font-semibold">
                        {formatPrice(v.price)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stock Indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {currentStock > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                In Stock ({currentStock} units available for instant dispatch)
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle size={14} /> Out of Stock
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className="btn-primary flex-1 py-3.5 text-xs sm:text-sm font-bold justify-center gap-2 shadow-lg shadow-brand-500/15"
              >
                <ShoppingBag size={16} /> {t("product.addToCart") || "Add to Cart"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={currentStock <= 0}
                className="btn-secondary py-3.5 px-5 text-xs sm:text-sm font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                {t("product.buyNow") || "Buy Now"}
              </button>

              <button
                onClick={() =>
                  toggleWishlist({
                    productId: product.id,
                    name: product.name,
                    brand: product.brand,
                    price: currentPrice,
                    mrp: product.mrp,
                    image: images[0],
                    slug: product.slug,
                    rating: product.rating,
                  })
                }
                className={`p-3.5 rounded-xl border transition-colors flex items-center justify-center ${
                  wishlisted
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
                aria-label="Wishlist"
                title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart size={18} className={wishlisted ? "fill-rose-600 dark:fill-rose-400" : ""} />
              </button>

              <button
                onClick={handleCompareToggle}
                className={`p-3.5 rounded-xl border transition-colors flex items-center justify-center ${
                  compared
                    ? "bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 text-brand-600 dark:text-brand-400 shadow-sm"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
                aria-label="Compare"
                title={compared ? "In Comparison (Click to remove)" : "Compare Product"}
              >
                <ArrowLeftRight size={18} className={compared ? "stroke-[2.5]" : ""} />
              </button>
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-600 dark:text-zinc-400">
            <div className="p-3 rounded-xl bg-zinc-50/60 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center">
              <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400 mb-1" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{t("product.genuineGuarantee") || "100% Genuine"}</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Direct Sourced</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50/60 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center">
              <Truck size={16} className="text-brand-600 dark:text-brand-400 mb-1" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{t("product.fastDispatch") || "Fast Dispatch"}</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">2-4 Business Days</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50/60 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center">
              <RotateCcw size={16} className="text-brand-600 dark:text-brand-400 mb-1" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">7-Day Return</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Damaged items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Specifications */}
      <div className="card p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-6">
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-none gap-2 sm:gap-6">
          {[
            { id: "nutrition", label: t("product.nutritionProfile") || "Nutrition Profile" },
            { id: "ingredients", label: t("product.ingredients") || "Ingredients & Purity" },
            { id: "usage", label: t("product.howToUse") || "How to Use" },
            { id: "compare", label: t("product.compareFormulas") || "Compare with Others" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-brand-600 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "nutrition" && (
          <div className="space-y-4 max-w-xl text-xs">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Verified Nutrient Breakdown per 30g Serving:</h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              {[
                { label: "Energy / Calories", value: "115 kcal" },
                { label: "Active Protein", value: "27.0 g" },
                { label: "Total Carbohydrates", value: "0.8 g" },
                { label: "Dietary Fat", value: "0.4 g" },
                { label: "BCAAs (Leucine, Isoleucine, Valine)", value: "6.2 g" },
                { label: "EAAs (Essential Amino Acids)", value: "12.8 g" },
                { label: "DigeZyme® Multi-Enzyme Complex", value: "50 mg" },
              ].map((r) => (
                <div key={r.label} className="p-3 flex justify-between bg-white dark:bg-zinc-900 odd:bg-zinc-50/50 dark:odd:bg-zinc-800/40">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{r.label}</span>
                  <span className="font-bold text-zinc-950 dark:text-white">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "ingredients" && (
          <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Full Ingredients:</h3>
            <p>
              Cross-Flow Microfiltered Whey Protein Isolate, Cocoa Powder (processed with alkali), Natural and Artificial Flavors, Sunflower Lecithin, DigeZyme® Multi-Enzyme Complex (Amylase, Protease, Lactase, Lipase, Cellulase), Sucralose.
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              *Allergens: Contains milk and soy (lecithin). Manufactured in an ISO 22000 & GMP certified facility.
            </p>
          </div>
        )}

        {activeTab === "usage" && (
          <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Recommended Directions:</h3>
            <p>
              Mix 1 scoop (approx. 30g) in 200–250ml of cold water, skimmed milk, or your favorite beverage in a shaker bottle. Shake vigorously for 20–30 seconds until completely dissolved.
            </p>
            <p>
              <strong>Best Timing:</strong> Consume within 30 minutes post-workout or as a high-protein supplement between meals.
            </p>
          </div>
        )}

        {activeTab === "compare" && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Side-by-Side Formula Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                  <tr>
                    <th className="p-3 font-bold text-[11px] uppercase">Parameter</th>
                    <th className="p-3 font-bold text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/30">{product.name}</th>
                    <th className="p-3 font-bold text-zinc-700 dark:text-zinc-300">Generic Market Protein</th>
                    <th className="p-3 font-bold text-zinc-700 dark:text-zinc-300">Budget Concentrate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  <tr>
                    <td className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Protein per 30g</td>
                    <td className="p-3 font-bold text-zinc-950 dark:text-white bg-brand-50/20 dark:bg-brand-950/20">27.0g (90%)</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">22.0g (73%)</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">18.0g (60%)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Digestive Enzymes</td>
                    <td className="p-3 font-bold text-zinc-950 dark:text-white bg-brand-50/20 dark:bg-brand-950/20">DigeZyme® Included</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">None</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">None</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Amino Spiking</td>
                    <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400 bg-brand-50/20 dark:bg-brand-950/20">Zero (Lab Certified)</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">Undisclosed</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">Undisclosed</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Price / Serving</td>
                    <td className="p-3 font-bold text-zinc-950 dark:text-white bg-brand-50/20 dark:bg-brand-950/20">₹52 / serving</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">₹68 / serving</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-400">₹45 / serving</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <ReviewForm productId={product.id} reviews={product.reviews || []} />
    </div>
  )
}
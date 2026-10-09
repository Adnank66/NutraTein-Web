"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Sparkles,
  Heart,
  ShoppingBag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Star,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/hooks/useTranslation"
import { useCartStore } from "@/store/cart"
import { useWishlistStore } from "@/store/wishlist"
import RevealText from "@/components/ui/reveal-text"
import { motion } from "framer-motion"

interface GoalProduct {
  id: string
  slug: string
  name: string
  type: "all" | "protein" | "creatine" | "gainer" | "carnitine" | "preworkout"
  brand: string
  badge: string
  badgeVariant: "best" | "offer" | "accent"
  image: string
  rating: number
  servingsInfo: string
  price: number
  mrp: number
  flavor: string
  size: string
  gradient: string
  glowColor: string
}

const GOAL_PRODUCTS: GoalProduct[] = [
  {
    id: "creacore-creatine-monohydrate",
    slug: "creatine-monohydrate",
    name: "CreaCore Creatine Monohydrate",
    type: "creatine",
    brand: "NUTRATEIN",
    badge: "BEST SELLER",
    badgeVariant: "best",
    image: "/assets/recommendations/creacore.jpg",
    rating: 5.0,
    servingsInfo: "80 servings",
    price: 699,
    mrp: 899,
    flavor: "Unflavored Creapure®",
    size: "250g",
    gradient: "from-[#061d39] to-[#238dd1]",
    glowColor: "rgba(203, 251, 255, 0.8)",
  },
  {
    id: "mass-tein-gainer",
    slug: "mass-tein-gainer",
    name: "Mass Tein Anabolic Mass Gainer",
    type: "gainer",
    brand: "NUTRATEIN",
    badge: "MASS GAINER",
    badgeVariant: "offer",
    image: "/assets/recommendations/mass-tein.jpg",
    rating: 5.0,
    servingsInfo: "Swiss chocolate",
    price: 3999,
    mrp: 4999,
    flavor: "Swiss Chocolate",
    size: "3 KG",
    gradient: "from-[#4c133b] to-[#b32f67]",
    glowColor: "rgba(255, 198, 232, 0.6)",
  },
  {
    id: "titan-loaded-preworkout",
    slug: "ignition-pre-workout",
    name: "Titan Loaded Pre-Workout",
    type: "preworkout",
    brand: "NUTRATEIN",
    badge: "PUMP & FOCUS",
    badgeVariant: "best",
    image: "/assets/recommendations/titan.jpg",
    rating: 5.0,
    servingsInfo: "30 servings",
    price: 2999,
    mrp: 3699,
    flavor: "Tangy Orange",
    size: "450g",
    gradient: "from-[#16121d] to-[#9c1d28]",
    glowColor: "rgba(255, 66, 38, 0.62)",
  },
  {
    id: "l-carnitine-liquid",
    slug: "l-carnitine-3000-liquid",
    name: "L-Carnitine 3300mg Triple Strength",
    type: "carnitine",
    brand: "NUTRATEIN",
    badge: "TRIPLE STRENGTH",
    badgeVariant: "offer",
    image: "/assets/recommendations/l-carnitine.jpg",
    rating: 5.0,
    servingsInfo: "Pineapple",
    price: 2499,
    mrp: 2999,
    flavor: "Pineapple Punch",
    size: "475ml",
    gradient: "from-[#271005] to-[#dc5e08]",
    glowColor: "rgba(255, 210, 99, 0.75)",
  },
  {
    id: "nitrotein-performance-whey-isolate",
    slug: "nitro-tein-whey-isolate",
    name: "NitroTein Performance Whey Protein",
    type: "protein",
    brand: "NUTRATEIN",
    badge: "WHEY PROTEIN",
    badgeVariant: "best",
    image: "/assets/recommendations/nitrotein.png",
    rating: 5.0,
    servingsInfo: "Swiss chocolate",
    price: 4499,
    mrp: 5499,
    flavor: "Swiss Chocolate",
    size: "1 KG",
    gradient: "from-[#050507] to-[#3e1710]",
    glowColor: "rgba(255, 80, 31, 0.62)",
  },
  {
    id: "shredtein-lean-protein-matrix",
    slug: "shred-tein-whey",
    name: "ShredTein Lean Protein Matrix",
    type: "protein",
    brand: "NUTRATEIN",
    badge: "LEAN MUSCLES",
    badgeVariant: "offer",
    image: "/assets/recommendations/shred-tein.png",
    rating: 5.0,
    servingsInfo: "Swiss chocolate",
    price: 4499,
    mrp: 5499,
    flavor: "Swiss Chocolate",
    size: "1 KG",
    gradient: "from-[#1c1204] to-[#593d11]",
    glowColor: "rgba(244, 194, 45, 0.6)",
  },
]

const CATEGORY_TABS = [
  { id: "all", label: "For You", icon: "✦" },
  { id: "protein", label: "Protein", icon: "◒" },
  { id: "creatine", label: "Creatine", icon: "◎" },
  { id: "gainer", label: "Gainer", icon: "↗" },
  { id: "carnitine", label: "L-Carnitine", icon: "◈" },
  { id: "preworkout", label: "Pre-Workout", icon: "ϟ" },
]

interface PersonalizedSectionProps {
  initialProducts?: any[]
}

export default function PersonalizedSection({ initialProducts }: PersonalizedSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("all")
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({})
  const rowRef = useRef<HTMLDivElement>(null)
  
  const [viewMode, setViewMode] = useState<"GOAL" | "PRODUCT">("GOAL")
  const [goalTabs, setGoalTabs] = useState<any[]>([{ id: "all", label: "For You", icon: "✦" }])
  const [productTabs, setProductTabs] = useState<any[]>([{ id: "all", label: "For You", icon: "✦" }])
  const [allProducts, setAllProducts] = useState<any[]>([])

  const addItem = useCartStore((s) => s.addItem)
  const wishlist = useWishlistStore((s) => s.items)
  const toggleWishlist = useWishlistStore((s) => s.toggleItem)
  const { t } = useTranslation()
  const isWishlisted = useWishlistStore((s) => s.isWishlisted)

  React.useEffect(() => {
    // Fetch Categories
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => {
        if (d.categories) {
          const goals = d.categories.filter((c: any) => c.type === 'GOAL')
          const products = d.categories.filter((c: any) => c.type !== 'GOAL')
          
          setGoalTabs([
            { id: "all", label: "For You", icon: "✦", linkedSlug: "all" },
            ...goals.map((g: any) => ({
              id: g.slug, 
              linkedSlug: g.linkedCategorySlug || g.slug,
              label: g.name, 
              icon: g.icon || "✦"
            }))
          ])

          setProductTabs([
            { id: "all", label: "All Products", icon: "✦", linkedSlug: "all" },
            ...products.map((p: any) => ({
              id: p.slug, 
              linkedSlug: p.slug,
              label: p.name, 
              icon: p.icon || "◒"
            }))
          ])
        }
      })
      .catch(console.error)

    fetch('/api/products?limit=12')
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setAllProducts(d.data)
        }
      })
      .catch(console.error)
  }, [])

  React.useEffect(() => {
    setActiveTab("all")
  }, [viewMode])

  const mapToGoalProduct = (p: any, idx: number): GoalProduct => {
    const gradients = [
      "from-[#050507] to-[#3e1710]",
      "from-[#1c1204] to-[#593d11]",
      "from-[#271005] to-[#dc5e08]",
      "from-[#090b14] to-[#142345]",
      "from-[#061413] to-[#123936]",
    ]
    const glows = [
      "rgba(255, 80, 31, 0.62)",
      "rgba(244, 194, 45, 0.6)",
      "rgba(255, 210, 99, 0.75)",
      "rgba(70, 130, 255, 0.6)",
      "rgba(40, 200, 160, 0.6)",
    ]
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      type: p.category?.slug || "all", 
      brand: p.brand || "NUTRATEIN",
      badge: p.category?.name?.toUpperCase() || "SUPPLEMENT",
      badgeVariant: "offer",
      image: p.images?.[0]?.url || p.image || "/assets/recommendations/nitrotein.png",
      rating: p.rating || 5.0,
      servingsInfo: p.flavor || "Multiple flavors",
      price: p.variants?.[0]?.price || p.basePrice || p.price,
      mrp: p.mrp || Math.round((p.variants?.[0]?.price || p.basePrice || p.price) * 1.25),
      flavor: p.flavor || p.shortDesc || "Unflavored",
      size: p.size || "Standard",
      gradient: gradients[idx % gradients.length],
      glowColor: glows[idx % glows.length],
    }
  }

  const filteredProducts = React.useMemo(() => {
    if (allProducts.length === 0) {
      return (activeTab === "all"
        ? GOAL_PRODUCTS
        : GOAL_PRODUCTS.filter((p) => p.type === activeTab)).slice(0, 3)
    }
    
    if (activeTab === "all") {
      return allProducts.slice(0, 4).map((p, idx) => mapToGoalProduct(p, idx))
    }

    let targetCategorySlug = activeTab
    if (viewMode === "GOAL") {
      const currentGoal = goalTabs.find((g) => g.id === activeTab)
      if (currentGoal?.linkedSlug && currentGoal.linkedSlug !== "all") {
        targetCategorySlug = currentGoal.linkedSlug
      }
    } else {
      const currentProduct = productTabs.find((p) => p.id === activeTab)
      if (currentProduct?.linkedSlug && currentProduct.linkedSlug !== "all") {
        targetCategorySlug = currentProduct.linkedSlug
      }
    }

    let filtered = allProducts.filter(p => p.category?.slug === targetCategorySlug)
    if (filtered.length === 0) {
      filtered = allProducts // fallback
    }
    
    return filtered.slice(0, 4).map((p, idx) => mapToGoalProduct(p, idx))
  }, [allProducts, activeTab, viewMode, goalTabs, productTabs])

  const handleAddToCart = (e: React.MouseEvent, product: GoalProduct) => {
    e.preventDefault()
    e.stopPropagation()

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      quantity: 1,
      flavor: product.flavor,
      size: product.size,
      slug: product.slug,
      stock: 50,
    })

    setAddedMap((prev) => ({ ...prev, [product.id]: true }))
    toast.success(`${product.name} added to cart!`, {
      description: "Added to your fitness nutrition stack.",
    })

    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [product.id]: false }))
    }, 1800)
  }

  const handleToggleWishlist = (e: React.MouseEvent, product: GoalProduct) => {
    e.preventDefault()
    e.stopPropagation()

    const alreadyFav = isWishlisted(product.id)
    toggleWishlist({
      id: product.id,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      slug: product.slug,
      rating: product.rating,
    })

    if (!alreadyFav) {
      toast.success("Saved to your wishlist!", { icon: "❤️" })
    }
  }

  const scrollTrack = (direction: "left" | "right") => {
    if (!rowRef.current) return
    const offset = direction === "left" ? -340 : 340
    rowRef.current.scrollBy({ left: offset, behavior: "smooth" })
  }

  return (
    <section
      id="recommended-goal"
      className="w-full py-16 sm:py-20 bg-[#fcfcfd] border-b border-[#e3e3e8] transition-colors overflow-hidden relative"
      aria-label="Recommended for your goal"
    >
      <motion.div 
        className="container-custom relative z-10"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Topline & Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <div className="block mb-3 text-[#9d9ba5] text-[11px] font-[800] tracking-[0.11em] uppercase">
              {t("home.personalisedNutrition")}
            </div>

            <h2 className="text-[clamp(2.05rem,4.3vw,3.58rem)] leading-[0.98] tracking-[-0.075em] font-[860] text-[#19191c] max-w-[680px]">
              {t("home.recommended")} <strong className="text-red-600 font-inherit">{t("home.forYou")}</strong>
            </h2>

            <p className="mt-3 text-[#777680] text-[clamp(0.86rem,1.2vw,1rem)] leading-[1.6] max-w-[660px]">
              {t("home.recommendedDesc")}
            </p>
          </div>


        </div>

        {/* Category Filter Tabs */}
        <nav
          className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-2 mb-8 sm:mb-10"
          aria-label="Supplement categories"
        >
          {goalTabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-[18px] py-[12px] rounded-full text-[13px] font-[750] transition-all border shrink-0 ${
                  isActive
                    ? "bg-[#19191c] text-white border-[#19191c] shadow-md -translate-y-[2px]"
                    : "bg-white text-[#5e5d66] border-[#e3e3e8] hover:border-[#b9b9c1] hover:-translate-y-[2px]"
                }`}
              >
                <span className={`text-base leading-none ${isActive ? "text-[#ff991f]" : "text-[#a5a4ad]"}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Horizontal Catalogue Carousel Track */}
        <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div
            ref={rowRef}
            className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-none scroll-smooth pb-8 pt-1"
          >
            {filteredProducts.map((product) => {
              const isAdded = addedMap[product.id]
              const isFav = isWishlisted(product.id)

              return (
                <GoalProductCard
                  key={product.id}
                  product={product}
                  isAdded={!!isAdded}
                  isFav={!!isFav}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                />
              )
            })}
          </div>
        </div>

        {/* Micro Scroll Guidance */}
        <p className="mt-2 text-[11px] text-[#a19fa7] flex items-center gap-2">
          <span className="w-[28px] h-[1px] bg-[#b9b7c0]" />
          <span>{t("home.hoverGuidance")}</span>
        </p>
      </motion.div>
    </section>
  )
}

function GoalProductCard({
  product,
  isAdded,
  isFav,
  onAddToCart,
  onToggleWishlist,
}: {
  product: GoalProduct
  isAdded: boolean
  isFav: boolean
  onAddToCart: (e: React.MouseEvent, p: GoalProduct) => void
  onToggleWishlist: (e: React.MouseEvent, p: GoalProduct) => void
}) {
  const { t } = useTranslation()
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="relative flex flex-col flex-none w-[265px] sm:w-[295px] min-h-[460px] sm:min-h-[480px] bg-white border border-[#e3e3e8] rounded-[19px] shadow-[0_5px_12px_rgba(27,27,31,0.02)] transition-all duration-[720ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:border-[#d1d1d8] hover:shadow-[0_24px_48px_rgba(34,34,38,0.14)] hover:-translate-y-[10px] group overflow-hidden"
    >
      {/* Visual Header */}
      <div className="relative h-[290px] sm:h-[320px] overflow-hidden bg-[#090909]">
        {/* Subtle lighting gradient overlay */}
        <div className="absolute inset-0 z-10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),transparent_42%,rgba(0,0,0,0.16))] pointer-events-none" />
        
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover object-center origin-center w-full h-full transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-hover:saturate-[1.08] group-hover:contrast-[1.03] z-[1]"
          sizes="(max-width: 640px) 265px, 295px"
          priority
          unoptimized
        />
      </div>

      {/* Top Badges & Action Tools */}
      <div className="absolute top-[14px] left-[14px] right-[14px] z-20 flex items-start justify-between pointer-events-none">
        {/* Pill Badge */}
        <span
          className={`px-[10px] py-[6px] rounded-full text-[10px] font-[800] tracking-[0.02em] uppercase transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:shadow-[0_8px_18px_rgba(0,0,0,0.18)] group-hover:-translate-y-[5px] group-hover:scale-[1.05] pointer-events-auto ${
            product.badgeVariant === "offer"
              ? "bg-[#fff7df] text-[#df7300]"
              : "bg-[#171719] text-white"
          }`}
        >
          {product.badge}
        </span>

        {/* Tool Buttons */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => onToggleWishlist(e, product)}
            aria-label="Save to Wishlist"
            className={`w-[34px] h-[34px] rounded-full border border-white/70 bg-white/85 text-[#62616b] flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.05)] transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-white group-hover:shadow-[0_8px_18px_rgba(0,0,0,0.18)] group-hover:-translate-y-[4px] group-hover:scale-[1.06] ${
              isFav ? "text-[#df7300]" : "hover:text-[#19191c]"
            }`}
          >
            <Heart size={16} className={isFav ? "fill-[#df7300]" : ""} />
          </button>

          <button
            type="button"
            onClick={(e) => onAddToCart(e, product)}
            aria-label="Quick Add to Cart"
            className={`w-[34px] h-[34px] rounded-full border border-white/70 bg-white/85 text-[#62616b] flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.05)] transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] delay-[60ms] group-hover:bg-white group-hover:shadow-[0_8px_18px_rgba(0,0,0,0.18)] group-hover:-translate-y-[7px] group-hover:scale-[1.06] hover:text-[#19191c]`}
          >
            {isAdded ? <Check size={16} className="text-[#4f7100]" /> : <ShoppingBag size={16} />}
          </button>
        </div>
      </div>

      {/* Product Copy & Metadata */}
      <div className="flex-1 p-[18px_18px_18px] bg-white transition-all duration-[720ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[#fefefc]">
        <span className="block mb-1.5 text-[10px] font-[850] tracking-[0.12em] text-[#9b9aa4] uppercase">
          {product.brand}
        </span>

        <h3 className="m-0 min-h-[44px] text-[15px] sm:text-[16px] leading-[1.3] tracking-[-0.025em] font-[790] text-[#19191c] line-clamp-2 transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-red-600">
          {product.name}
        </h3>

        {/* Rating Tag */}
        <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 border border-[#ffd877] rounded text-[11px] font-[800] text-[#d88a00] bg-[#fffaf0]">
          <Star size={12} className="fill-[#d88a00]" />
          <span>{product.rating.toFixed(1)}</span>
          <span className="text-[#a9a8af] font-[550]">
            ({product.servingsInfo})
          </span>
        </div>

        {/* Price & Action Row */}
        <div className="mt-3.5 pt-2.5 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-black text-[#19191c]">₹{product.price.toLocaleString("en-IN")}</span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-xs text-[#9b9aa4] line-through font-medium">₹{product.mrp.toLocaleString("en-IN")}</span>
            )}
          </div>
          <span className="text-xs font-bold text-red-600 group-hover:underline flex items-center gap-1">
            {t("product.viewProduct")} <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}

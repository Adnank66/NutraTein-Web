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

  const addItem = useCartStore((s) => s.addItem)
  const wishlist = useWishlistStore((s) => s.items)
  const toggleWishlist = useWishlistStore((s) => s.toggleItem)
  const isWishlisted = useWishlistStore((s) => s.isWishlisted)

  const filteredProducts =
    (activeTab === "all"
      ? GOAL_PRODUCTS
      : GOAL_PRODUCTS.filter((p) => p.type === activeTab)
    ).slice(0, 3)

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
              Personalised nutrition
            </div>

            <h2 className="text-[clamp(2.05rem,4.3vw,3.58rem)] leading-[0.98] tracking-[-0.075em] font-[860] text-[#19191c] max-w-[680px]">
              Recommended <strong className="text-[#668c00] font-inherit">for your goal.</strong>
            </h2>

            <p className="mt-3 text-[#777680] text-[clamp(0.86rem,1.2vw,1rem)] leading-[1.6] max-w-[660px]">
              Choose a product category to find the nutrition that best supports your training, recovery, and next workout.
            </p>
          </div>

          {/* Quick Explore Link & Scroll Arrows */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/shop"
              className="text-xs font-[800] text-[#19191c] hover:underline underline-offset-[5px] flex items-center gap-1.5 mr-2"
            >
              <span>Explore all products</span>
              <ArrowRight size={13} />
            </Link>

            <button
              type="button"
              onClick={() => scrollTrack("left")}
              aria-label="Previous products"
              className="w-10 h-10 rounded-full border border-[#e3e3e8] bg-white text-[#19191c] flex items-center justify-center hover:border-[#19191c] hover:bg-[#d8ff54] shadow-sm active:scale-95 transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => scrollTrack("right")}
              aria-label="Next products"
              className="w-10 h-10 rounded-full border border-[#e3e3e8] bg-white text-[#19191c] flex items-center justify-center hover:border-[#19191c] hover:bg-[#d8ff54] shadow-sm active:scale-95 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <nav
          className="flex items-center gap-2.5 overflow-x-auto scrollbar-none pb-2 mb-8 sm:mb-10"
          aria-label="Supplement categories"
        >
          {CATEGORY_TABS.map((tab) => {
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
          <span>Hover over a product to inspect it · Select a type to bring it into view</span>
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
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="relative flex flex-col flex-none w-[270px] sm:w-[300px] min-h-[480px] bg-white border border-[#e3e3e8] rounded-[19px] shadow-[0_5px_12px_rgba(27,27,31,0.02)] transition-all duration-[720ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:border-[#d1d1d8] hover:shadow-[0_24px_48px_rgba(34,34,38,0.14)] hover:-translate-y-[10px] group overflow-hidden"
    >
      {/* Visual Header */}
      <div className="relative h-[306px] overflow-hidden bg-[#090909]">
        {/* Subtle lighting gradient overlay */}
        <div className="absolute inset-0 z-10 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),transparent_42%,rgba(0,0,0,0.16))] pointer-events-none" />
        
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-contain p-[5px] transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] origin-center group-hover:scale-[1.065] group-hover:saturate-[1.08] group-hover:contrast-[1.03] z-[1]"
          sizes="(max-width: 640px) 270px, 300px"
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
      <div className="flex-1 p-[22px_20px_20px] bg-white transition-all duration-[720ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[#fefefc] group-hover:-translate-y-[4px]">
        <span className="block mb-2.5 text-[10px] font-[850] tracking-[0.12em] text-[#9b9aa4] uppercase">
          {product.brand}
        </span>

        <h3 className="m-0 min-h-[49px] text-[16px] leading-[1.35] tracking-[-0.025em] font-[790] text-[#19191c] transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[#4f7100] group-hover:translate-x-[3px]">
          {product.name}
        </h3>

        {/* Rating Tag */}
        <div className="inline-flex items-center gap-1.5 mt-[13px] px-2 py-1.5 border border-[#ffd877] rounded text-[11px] font-[800] text-[#d88a00] bg-[#fffaf0]">
          <Star size={12} className="fill-[#d88a00]" />
          <span>{product.rating.toFixed(1)}</span>
          <span className="text-[#a9a8af] font-[550]">
            ({product.servingsInfo})
          </span>
        </div>

        {/* Price & Action Row */}
        <div className="mt-[25px] flex items-baseline gap-2.5 text-[21px] font-[880] tracking-[-0.04em] text-[#19191c] transition-all duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[3px]">
          View product
          <span className="text-[11px] font-[500] text-[#a9a8af] tracking-normal">
            {product.flavor || "Formula"}
          </span>
        </div>
      </div>
    </Link>
  )
}
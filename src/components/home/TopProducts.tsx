"use client"

import React, { useRef, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Star,
  ArrowRight,
  ShieldCheck,
  Check,
  Play,
  Film,
  Sparkles,
  ShoppingBag,
  Zap,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import { useCartStore } from "@/store/cart"
import RevealText from "@/components/ui/reveal-text"
import AnimatedButton from "@/components/ui/animated-button"
import { formatPrice } from "@/lib/utils"

interface TopProductItem {
  id: string
  slug: string
  name: string
  kicker: string
  description: string
  badge: string
  badgeVariant?: "red" | "gold"
  image: string
  videoUrl: string
  videoName: string
  videoLabel: string
  poster: string
  price: number
  mrp: number
  rating: number
  reviewsCount: number
  servings: string
  bgGradient: string
}

const DEFAULT_TOP_SELLERS: TopProductItem[] = [
  {
    id: "shred-tein-whey",
    slug: "shred-tein-whey",
    name: "ShredTein Lean Protein Matrix",
    kicker: "ADVANCED LEAN PROTEIN",
    description: "Swiss Chocolate · Fortified with CLA, Green Tea & Digestive Enzymes",
    badge: "LEAN\nMATRIX",
    badgeVariant: "gold",
    image: "/assets/top-sellers/shredtein-lean-protein.png",
    videoUrl: "/assets/video/shredtein-ani-video.mp4",
    videoName: "shredtein ani video",
    videoLabel: "ShredTein 4K",
    poster: "/assets/top-sellers/shredtein-lean-protein.png",
    price: 2699,
    mrp: 3099,
    rating: 5.0,
    reviewsCount: 92,
    servings: "30 Servings",
    bgGradient: "bg-[#1c1204]",
  },
  {
    id: "ignition-pre-workout",
    slug: "ignition-pre-workout",
    name: "Titan Loaded Pre-Workout",
    kicker: "EXPLOSIVE PUMP & ENERGY",
    description: "Tangy Orange · Citrulline Malate, Beta-Alanine & Caffeine for Heavy Lifts",
    badge: "PUMP &\nFOCUS",
    badgeVariant: "red",
    image: "/assets/recommendations/titan.jpg",
    videoUrl: "/assets/video/pre-ani-4k.mp4",
    videoName: "pre ani 4k",
    videoLabel: "Pre Ani 4K",
    poster: "/assets/recommendations/titan.jpg",
    price: 2999,
    mrp: 3699,
    rating: 5.0,
    reviewsCount: 114,
    servings: "30 Servings",
    bgGradient: "bg-[#1a0808]",
  },
  {
    id: "nitro-tein-whey-isolate",
    slug: "nitro-tein-whey-isolate",
    name: "NitroTein Performance Whey",
    kicker: "PERFORMANCE WHEY",
    description: "Swiss Chocolate · 30 g pure protein per serving with zero amino spiking",
    badge: "30G\nPROTEIN",
    badgeVariant: "red",
    image: "/assets/top-sellers/nitrotein-performance-whey.png",
    videoUrl: "/assets/video/shreded-ani-4k.mp4",
    videoName: "shreded ani 4k",
    videoLabel: "NitroTein 4K",
    poster: "/assets/top-sellers/nitrotein-performance-whey.png",
    price: 2499,
    mrp: 2899,
    rating: 5.0,
    reviewsCount: 128,
    servings: "30 Servings",
    bgGradient: "bg-[#1d0808]",
  },
]

function resolveVideoUrl(url?: string, name?: string): string {
  if (!url) return "/assets/video/shredtein-ani-video.mp4"
  const cleanUrl = url.trim()
  if (cleanUrl.toLowerCase().endsWith(".mp4")) {
    return cleanUrl
  }
  const probe = (cleanUrl + " " + (name || "")).toLowerCase()
  if (probe.includes("pre")) return "/assets/video/pre-ani-4k.mp4"
  if (probe.includes("nitro")) return "/assets/video/shreded-ani-4k.mp4"
  if (probe.includes("shred")) return "/assets/video/shredtein-ani-video.mp4"
  return "/assets/video/shredtein-ani-video.mp4"
}

export default function TopProducts() {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [items, setItems] = useState<TopProductItem[]>(DEFAULT_TOP_SELLERS)
  const [activeVideoIdx, setActiveVideoIdx] = useState<number>(0)
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({})
  const [liveRatings, setLiveRatings] = useState<Record<string, { rating: number; count: number }>>({})

  const cardRef = useRef<HTMLElement>(null)
  const [cardTiltStyle, setCardTiltStyle] = useState<React.CSSProperties>({})
  const [cardText3dStyle, setCardText3dStyle] = useState<React.CSSProperties>({})

  // Desktop Mouse Tilt
  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return
    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    const x = e.clientX - left
    const y = e.clientY - top
    const rotateX = ((y - height / 2) / (height / 2)) * -7
    const rotateY = ((x - width / 2) / (width / 2)) * 7
    setCardTiltStyle({
      transform: `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`,
      transition: "transform 0.08s ease-out",
    })
    setCardText3dStyle({
      transform: `translateZ(18px) rotateX(${(rotateX * 0.5).toFixed(2)}deg) rotateY(${(rotateY * 0.5).toFixed(2)}deg)`,
      transition: "transform 0.08s ease-out",
    })
  }

  const handleCardMouseLeave = () => {
    setCardTiltStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
    })
    setCardText3dStyle({
      transform: "translateZ(0px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
    })
  }

  // Mobile Touch Finger Rotation & Zoom
  const handleCardTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (!cardRef.current || !e.touches[0]) return
    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - left
    const y = touch.clientY - top
    const normX = Math.max(-1, Math.min(1, (x - width / 2) / (width / 2)))
    const normY = Math.max(-1, Math.min(1, (y - height / 2) / (height / 2)))
    const rotateX = -normY * 9
    const rotateY = normX * 9
    setCardTiltStyle({
      transform: `perspective(850px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.035, 1.035, 1.035)`,
      transition: "transform 0.12s ease-out",
    })
    setCardText3dStyle({
      transform: `translateZ(22px) rotateX(${(-normY * 7).toFixed(2)}deg) rotateY(${(normX * 7).toFixed(2)}deg)`,
      transition: "transform 0.12s ease-out",
    })
  }

  const handleCardTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (!cardRef.current || !e.touches[0]) return
    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - left
    const y = touch.clientY - top
    const normX = Math.max(-1, Math.min(1, (x - width / 2) / (width / 2)))
    const normY = Math.max(-1, Math.min(1, (y - height / 2) / (height / 2)))
    const rotateX = -normY * 10
    const rotateY = normX * 10
    setCardTiltStyle({
      transform: `perspective(850px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.035, 1.035, 1.035)`,
      transition: "transform 0.06s ease-out",
    })
    setCardText3dStyle({
      transform: `translateZ(22px) rotateX(${(-normY * 8).toFixed(2)}deg) rotateY(${(normX * 8).toFixed(2)}deg)`,
      transition: "transform 0.06s ease-out",
    })
  }

  const handleCardTouchEnd = () => {
    setCardTiltStyle({
      transform: "perspective(850px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
    })
    setCardText3dStyle({
      transform: "translateZ(0px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
    })
  }

  const activeItem = items[activeVideoIdx] || items[0]

  // 1. Fetch live review ratings from database
  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.reviews) {
          const map: Record<string, { total: number; sum: number }> = {}
          for (const r of data.reviews) {
            const slug = r.productSlug || r.productId
            if (!map[slug]) map[slug] = { total: 0, sum: 0 }
            map[slug].total += 1
            map[slug].sum += r.rating
          }
          const finalMap: Record<string, { rating: number; count: number }> = {}
          for (const k of Object.keys(map)) {
            finalMap[k] = {
              rating: Number((map[k].sum / map[k].total).toFixed(1)),
              count: map[k].total,
            }
          }
          setLiveRatings(finalMap)
        }
      })
      .catch(() => {})
  }, [])

  // 2. Fetch dynamic influencer / top seller videos configured in Admin Panel
  useEffect(() => {
    fetch("/api/admin/videos")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.videos && data.videos.length > 0) {
          const dynamicItems: TopProductItem[] = data.videos
            .filter((v: any) => v.isActive !== false)
            .map((v: any) => ({
              id: v.productId || v.id,
              slug: v.productSlug || v.productId || "nitro-tein-whey-isolate",
              name: v.productName || v.title,
              kicker: v.kicker || v.title,
              description: v.tagline || "Engineered for elite athletic performance and rapid muscle growth.",
              badge: v.badge || "TOP SELLER",
              badgeVariant: v.badgeVariant || "red",
              image: v.productImage || v.poster || "/assets/top-sellers/nitrotein-performance-whey.png",
              videoUrl: resolveVideoUrl(v.videoUrl, v.title || v.productName),
              videoName: v.title || "Video Showcase",
              videoLabel: v.title.length > 18 ? v.title.slice(0, 18) + "..." : v.title,
              poster: v.poster || v.productImage || "",
              price: Number(v.price) || 2499,
              mrp: Number(v.mrp) || 2999,
              rating: 5.0,
              reviewsCount: 120,
              servings: v.servings || "30 Servings",
              bgGradient: "bg-[#180a0a]",
            }))
          if (dynamicItems.length > 0) {
            setItems(dynamicItems.slice(0, 4))
          }
        }
      })
      .catch(() => {})
  }, [])

  // Ensure video plays strictly noiseless (muted, volume = 0) with autoplay resilience
  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    v.muted = true
    v.volume = 0
    v.defaultMuted = true

    const tryPlay = () => {
      try {
        const p = v.play()
        if (p !== undefined) {
          p.catch(() => {
            // Autoplay restriction handled smoothly
          })
        }
      } catch {}
    }

    tryPlay()
    const handleCanPlay = () => tryPlay()
    v.addEventListener("canplay", handleCanPlay)
    return () => {
      v.removeEventListener("canplay", handleCanPlay)
    }
  }, [activeItem.videoUrl])

  const handleAddToCart = (item: TopProductItem) => {
    addItem({
      id: item.id,
      productId: item.id,
      name: item.name,
      brand: "NUTRATEIN",
      price: item.price,
      mrp: item.mrp,
      image: item.image,
      quantity: 1,
      stock: 50,
      slug: item.slug,
    })

    setAddedMap((prev) => ({ ...prev, [item.id]: true }))
    toast.success(`${item.name} added to cart!`, {
      description: `Formula added at ${formatPrice(item.price)}`,
    })

    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [item.id]: false }))
    }, 2000)
  }

  const handleBuyNow = (item: TopProductItem) => {
    handleAddToCart(item)
    openCart()
  }

  const liveReview = liveRatings[activeItem.slug] || liveRatings[activeItem.id]
  const displayRating = liveReview ? liveReview.rating : activeItem.rating
  const displayCount = liveReview ? liveReview.count : activeItem.reviewsCount
  const isAdded = addedMap[activeItem.id]

  return (
    <section
      id="top-sellers"
      className="py-16 sm:py-20 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 transition-colors overflow-hidden"
      aria-label="Top Sellers Section"
    >
      <motion.div 
        className="container-custom"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Section Header */}
        <div className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={13} />
              <span>ATHLETES CHOICE • 4K SHOWCASE</span>
            </div>
            <RevealText
              text="Our Top Sellers"
              as="h2"
              size="custom"
              duration={0.35}
              stagger={0.02}
              className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 dark:text-white uppercase !justify-start !text-left !px-0"
            />
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-xl leading-relaxed">
              Experience the raw power of our flagship formulas in full 4K. Switch videos to inspect each formula with its live interactive cart on the right.
            </p>
          </div>

          {/* Video Selector Tabs Bar */}
          <div className="flex items-center gap-2 flex-wrap bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 px-2 uppercase tracking-wider hidden sm:inline">
              SELECT VIDEO:
            </span>
            {items.map((item, idx) => {
              const isCurrent = activeVideoIdx === idx
              return (
                <button
                  key={item.id + idx}
                  type="button"
                  onClick={() => setActiveVideoIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    isCurrent
                      ? "bg-red-600 text-white shadow-md scale-105"
                      : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800"
                  }`}
                >
                  <Film size={12} className={isCurrent ? "text-white" : "text-zinc-400"} />
                  <span>{item.videoName}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Main Showcase Grid (Arranged dynamically based on screen) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* ============================================================= */}
          {/* Left Column: 4K Video Player (Arranged size based on screen)   */}
          {/* ============================================================= */}
          <div className="lg:col-span-7 relative w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[580px] xl:h-[620px] rounded-3xl overflow-hidden bg-black border border-zinc-800/80 shadow-2xl p-5 sm:p-7 flex flex-col justify-between group">
            {/* The 4K Video Element: Strictly Noiseless (muted, volume 0) */}
            <video
              ref={videoRef}
              key={activeItem.videoUrl}
              src={activeItem.videoUrl}
              className="ts-bg-video absolute inset-0 w-full h-full object-contain sm:object-cover object-center transition-opacity duration-700 pointer-events-none"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster={activeItem.poster}
              onError={(e) => {
                const target = e.currentTarget
                if (!target.src.endsWith("shredtein-ani-video.mp4")) {
                  target.src = "/assets/video/shredtein-ani-video.mp4"
                  target.load()
                  target.play().catch(() => {})
                }
              }}
              aria-label={`${activeItem.name} 4K Video`}
            >
              <source src={activeItem.videoUrl} type="video/mp4" />
              Your browser does not support HTML video.
            </video>

            {/* Stronger Gradient Scrim Overlay for Text Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />

            {/* Top Row: Current Playing Pill & 4K Quality Seal */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.15em] text-white uppercase bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-md">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                PLAYING: {activeItem.videoName.toUpperCase()}
              </span>

              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/20 flex flex-col items-center justify-center text-center bg-black/80 backdrop-blur-md rotate-6 shadow-lg shrink-0 pointer-events-none"
                aria-hidden="true"
              >
                <span className="text-[6px] font-mono tracking-widest text-zinc-300">ULTRA HD</span>
                <strong className="text-xs sm:text-sm font-black text-white leading-none my-0.5">4K</strong>
                <small className="text-[6px] font-mono tracking-wider text-red-400 font-bold uppercase">PREMIER</small>
              </div>
            </div>

            {/* Bottom Overlay: Video Title, Tagline & Direct Explorer */}
            <div className="relative z-10 max-w-lg space-y-2 pt-6 mb-2">
              <span className="inline-block px-2 py-1 bg-red-600/90 text-[10px] sm:text-xs font-black tracking-widest text-white uppercase rounded shadow-sm">
                {activeItem.kicker}
              </span>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black italic tracking-tight text-white uppercase leading-tight drop-shadow-lg">
                {activeItem.name}
              </h3>

              <p className="text-xs sm:text-sm text-zinc-100 leading-relaxed font-medium line-clamp-2 drop-shadow-md max-w-md">
                {activeItem.description}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <AnimatedButton
                  href={`/shop/${activeItem.slug}`}
                  accentColor="bg-red-600"
                  className="bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2.5 px-5 shadow-xl"
                >
                  <span className="tracking-widest uppercase">Inspect Formula</span>
                  <span className="text-sm ml-1" aria-hidden="true">↗</span>
                </AnimatedButton>

                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (activeVideoIdx + 1) % items.length
                    setActiveVideoIdx(nextIdx)
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-zinc-200 hover:text-white bg-black/60 backdrop-blur-md border border-white/20 py-2.5 px-3.5 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span>Next Video ({items[(activeVideoIdx + 1) % items.length]?.videoName})</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================= */}
          {/* Right Column: ONLY SHOW THE ACTIVE VIDEO'S PRODUCT CART/CARD   */}
          {/* ============================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <article
              ref={cardRef}
              key={activeItem.id}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onTouchStart={handleCardTouchStart}
              onTouchMove={handleCardTouchMove}
              onTouchEnd={handleCardTouchEnd}
              onTouchCancel={handleCardTouchEnd}
              style={cardTiltStyle}
              className="relative w-full h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xl transition-all hover:border-red-500/50 [transform-style:preserve-3d] will-change-transform touch-pan-y"
            >
              <div>
                {/* Visual Image Container with Smooth Slow Zoom Hover */}
                <div
                  className={`relative h-80 sm:h-96 md:h-[390px] w-full rounded-2xl bg-zinc-900 overflow-hidden group cursor-pointer`}
                  onClick={() => router.push(`/shop/${activeItem.slug}`)}
                >
                  {/* Circular Pill Badge */}
                  <div
                    className={`absolute top-3.5 left-3.5 z-20 w-12 h-12 rounded-full border flex flex-col items-center justify-center text-center shadow-lg pointer-events-none ${
                      activeItem.badgeVariant === "gold"
                        ? "border-[#f4c22d]/60 bg-[#2d1e02]/90 text-[#f4c22d]"
                        : "border-red-500/60 bg-[#2a0408]/90 text-red-400"
                    }`}
                  >
                    <span className="text-[8px] font-black leading-tight tracking-wider uppercase whitespace-pre-line text-center">
                      {activeItem.badge}
                    </span>
                  </div>

                  {/* Active Video Sync Tag */}
                  <span className="absolute top-3.5 right-3.5 z-20 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[9px] font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1">
                    <Film size={10} className="text-red-400" />
                    <span>SYNCED TO VIDEO</span>
                  </span>

                  {/* Product Bottle / Tub Image with Smooth Slow Zoom - Fits based on card size with zero side gaps */}
                  <div className="relative w-full h-full">
                    <Image
                      src={activeItem.image}
                      alt={activeItem.name}
                      fill
                      className="object-cover object-center w-full h-full drop-shadow-2xl transition-transform duration-700 ease-out group-hover:scale-105"
                      priority
                      unoptimized
                    />
                  </div>
                </div>

                {/* Rating & Authenticity Strip */}
                <div className="flex items-center justify-between pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} className="fill-amber-400 stroke-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                      {displayRating.toFixed(1)}
                    </span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                      ({displayCount} reviews)
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck size={12} /> 100% Authentic
                  </span>
                </div>

                {/* Product Title & Info with 3D text rotation */}
                <div className="pt-3 space-y-1 transition-transform duration-100 [transform-style:preserve-3d] will-change-transform" style={cardText3dStyle}>
                  <span className="text-[10px] font-bold tracking-widest text-red-600 dark:text-red-400 uppercase">
                    {activeItem.kicker}
                  </span>
                  <Link href={`/shop/${activeItem.slug}`}>
                    <h4 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white leading-tight hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      {activeItem.name}
                    </h4>
                  </Link>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed pt-0.5">
                    {activeItem.description}
                  </p>
                </div>
              </div>

              {/* Price, Servings & Action Buttons with 3D depth */}
              <div className="pt-4 space-y-3 border-t border-zinc-100 dark:border-zinc-800 mt-4 transition-transform duration-100 [transform-style:preserve-3d] will-change-transform" style={cardText3dStyle}>
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-zinc-950 dark:text-white">
                      {formatPrice(activeItem.price)}
                    </span>
                    {activeItem.mrp > activeItem.price && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 line-through">
                        {formatPrice(activeItem.mrp)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
                    {activeItem.servings}
                  </span>
                </div>

                {/* Working Cart & Buy Now Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(activeItem)}
                    className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md ${
                      isAdded
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={14} className="stroke-[3]" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={14} />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBuyNow(activeItem)}
                    className="py-3 px-4 rounded-xl text-xs font-black bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Zap size={14} className="text-amber-400 dark:text-amber-600 fill-current" />
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
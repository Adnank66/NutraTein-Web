"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Eye, ShieldCheck, Tag } from "lucide-react"
import RevealText from "@/components/ui/reveal-text"
import AnimatedButton from "@/components/ui/animated-button"
import { motion, AnimatePresence } from "framer-motion"

interface BannerItem {
  id: string
  title: string
  subtitle: string
  badgeText: string
  ctaText: string
  ctaLink: string
  imageUrl: string
  objectFit: "contain" | "cover"
  isActive: boolean
  sortOrder: number
}

const FALLBACK_BANNERS: BannerItem[] = [
  {
    id: "ban-whey",
    title: "NITROTEIN PERFORMANCE WHEY",
    subtitle: "30g Pure Protein • Rapid Muscle Recovery • Swiss Chocolate",
    badgeText: "FLAGSHIP PERFORMANCE",
    ctaText: "Shop NitroTein Whey",
    ctaLink: "/shop/nitro-tein-whey-isolate",
    imageUrl: "/assets/banners/whey-red-banner.png",
    objectFit: "contain",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "ban-shred",
    title: "SHREDTEIN LEAN PROTEIN MATRIX",
    subtitle: "Advanced Thermogenic Formula • Fortified with CLA & Green Tea",
    badgeText: "LEAN MUSCLE GAINS",
    ctaText: "Explore ShredTein",
    ctaLink: "/shop/shred-tein-whey",
    imageUrl: "/assets/banners/SHRED -TEIN wheyyellow banner new.png",
    objectFit: "contain",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "ban-creatine",
    title: "CREACORE CREATINE MONOHYDRATE",
    subtitle: "99.9% Pure Creapure® Grade • Instant Cellular ATP Surge",
    badgeText: "CLINICAL PURITY",
    ctaText: "Shop CreaCore",
    ctaLink: "/shop/creatine-monohydrate",
    imageUrl: "/assets/banners/createin banner.png",
    objectFit: "contain",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "ban-preworkout",
    title: "TITAN LOADED PRE-WORKOUT",
    subtitle: "High-Stim Beta-Alanine & Citrulline Malate Explosive Focus",
    badgeText: "UNSTOPPABLE PUMP",
    ctaText: "Explore Pre-Workouts",
    ctaLink: "/shop/ignition-pre-workout",
    imageUrl: "/assets/banners/PreWorkout banner new.png",
    objectFit: "contain",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "ban-carnitine",
    title: "L-CARNITINE 3300MG TRIPLE STRENGTH",
    subtitle: "Liquid Thermogenic Energy • Rapid Fat Oxidation & Endurance",
    badgeText: "TRIPLE STRENGTH",
    ctaText: "Shop L-Carnitine",
    ctaLink: "/shop/l-carnitine-3000-liquid",
    imageUrl: "/assets/banners/l-carnitine-widescreen-banner.png",
    objectFit: "cover",
    isActive: true,
    sortOrder: 5,
  },
]

export default function Hero() {
  const [banners, setBanners] = useState<BannerItem[]>(FALLBACK_BANNERS)
  const [globalFitMode, setGlobalFitMode] = useState<"contain" | "cover">("cover")
  const [bannerWidthMode, setBannerWidthMode] = useState<string>("1600")
  const [bannerHeightMode, setBannerHeightMode] = useState<string>("xl")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  // Fetch dynamic banners from Admin API
  useEffect(() => {
    fetch("/api/admin/banners")
      .then((res) => res.json())
      .then((data) => {
        if (data.banners && data.banners.length > 0) {
          const active = data.banners.filter((b: BannerItem) => b.isActive === true)
          if (active.length > 0) {
            setBanners(active)
          } else {
            // If all banners are deactivated, empty the carousel to hide them.
            setBanners([])
          }
          if (data.fitMode) {
            setGlobalFitMode(data.fitMode)
          }
          if (data.bannerWidth) {
            setBannerWidthMode(data.bannerWidth)
          }
          if (data.bannerHeight) {
            setBannerHeightMode(data.bannerHeight)
          }
        }
      })
      .catch(() => {})
  }, [])

  const currentBanner = banners[currentIndex] || banners[0]
  const effectiveFit = currentBanner?.objectFit || globalFitMode

  // Slide controls
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }, [banners.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }, [banners.length])

  // Auto-play timer
  useEffect(() => {
    if (isPaused || banners.length <= 1) return
    const timer = setInterval(() => {
      handleNext()
    }, 5500)
    return () => clearInterval(timer)
  }, [isPaused, banners.length, handleNext])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isZoomOpen) {
        if (e.key === "Escape") setIsZoomOpen(false)
        return
      }
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isZoomOpen, handleNext, handlePrev])

  if (!banners || banners.length === 0) {
    return null
  }

  return (
    <section
      id="hero-banner"
      className="relative w-full bg-zinc-950 text-white overflow-hidden select-none border-b border-zinc-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Nutra Tein Promotional Banners"
    >
      {/* Dynamic Ambient Background Blur */}
      <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
        <div
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[120%] rounded-full blur-[140px] transition-colors duration-1000"
          style={{
            background:
              currentIndex % 2 === 0
                ? "radial-gradient(circle, #ff293c 0%, transparent 70%)"
                : "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[120%] rounded-full blur-[140px] transition-colors duration-1000"
          style={{
            background:
              currentIndex % 2 === 0
                ? "radial-gradient(circle, #b91c1c 0%, transparent 70%)"
                : "radial-gradient(circle, #d97706 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Outer Banner Wrapper */}
      <div className="relative z-10 w-full transition-all">
        {/* Banner Frame (Arranged to fit & fill properly based on screen) */}
        <div className="relative w-full overflow-hidden bg-black/90 group">
          {/* Main Visual Slide Container with dynamic larger height options */}
          <div
            className={`relative w-full flex items-center justify-center overflow-hidden ${
              bannerHeightMode === "xl"
                ? "h-[450px] sm:h-[460px] md:h-[560px] lg:h-[660px] xl:h-[760px] 2xl:h-[820px]"
                : bannerHeightMode === "lg"
                ? "h-[400px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[680px]"
                : "h-[320px] sm:h-[320px] md:h-[400px] lg:h-[480px] xl:h-[540px]"
            }`}
          >
            {/* Ambient blurred backdrop so any aspect ratio renders seamlessly without black voids */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
              <Image
                src={currentBanner.imageUrl}
                alt=""
                fill
                unoptimized
                className="object-cover object-center scale-115 blur-3xl opacity-45 brightness-75"
              />
            </div>

            <Link
              href={currentBanner.ctaLink || "/shop"}
              className="relative w-full h-full block z-10 overflow-hidden"
              aria-label={`View ${currentBanner.title}`}
            >
              <motion.div
                key={currentBanner.id}
                initial={{ scale: 1.15, clipPath: "inset(100% 0 0 0)" }}
                animate={{ scale: 1, clipPath: "inset(0% 0 0 0)" }}
                transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1] }}
                className="w-full h-full"
              >
                <Image
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title}
                  fill
                  priority
                  quality={100}
                  unoptimized
                  className={`w-full h-full transition-all duration-700 ease-out group-hover:scale-[1.015] group-hover:brightness-105 ${
                    effectiveFit === "contain"
                      ? "object-contain object-center"
                      : "object-cover object-center"
                  }`}
                  sizes="(max-width: 768px) 100vw, 1920px"
                />
              </motion.div>
            </Link>

            {/* Subtle bottom edge gradient to ensure CTA & title contrast without darkening the 4K banner graphic */}
            <div
              className="hidden sm:block absolute inset-x-0 bottom-0 h-24 sm:h-32 pointer-events-none bg-gradient-to-t from-black/75 via-black/30 to-transparent"
              aria-hidden="true"
            />
            {/* Top Bar: Slide Badge & 4K Indicator */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-20 flex items-center justify-between pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md border border-white/20 text-white shadow-lg pointer-events-auto">
                <Sparkles size={12} className="text-amber-400" />
                {currentBanner.badgeText || "EXCLUSIVE FORMULA"}
              </span>

              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsZoomOpen(true)
                  }}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md border border-white/20 text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
                  title="Inspect Banner in 4K"
                >
                  <Eye size={12} />
                  <span className="hidden sm:inline">4K Preview</span>
                </button>
                <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold bg-red-600 text-white shadow-md">
                  NUTRA TEIN 4K
                </span>
              </div>
            </div>
            {/* Previous & Next Navigation Arrows */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-80 hover:opacity-100 hover:scale-110 transition-all shadow-xl"
              aria-label="Previous Banner"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-80 hover:opacity-100 hover:scale-110 transition-all shadow-xl"
              aria-label="Next Banner"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Bottom Overlay: Text & Quick Action CTA (Stacked below on mobile, overlay on sm+) */}
          <div className="sm:absolute relative bottom-0 sm:bottom-5 left-0 sm:left-6 right-0 sm:right-6 z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:pointer-events-none p-4 sm:p-0 bg-zinc-950 sm:bg-transparent border-t border-zinc-800 sm:border-none">
              <motion.div 
                key={`text-${currentBanner.id}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-lg space-y-1 pointer-events-auto sm:bg-black/50 sm:backdrop-blur-md px-1 sm:px-4 py-1 sm:py-2.5 rounded-none sm:rounded-2xl border-none sm:border sm:border-white/15 sm:shadow-xl flex-1"
              >
                <h2 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-tight text-white drop-shadow-sm line-clamp-2 sm:line-clamp-1">
                  {currentBanner.title}
                </h2>
                <p className="text-xs font-medium text-zinc-400 sm:text-zinc-300 drop-shadow line-clamp-2 sm:line-clamp-1">
                  {currentBanner.subtitle}
                </p>
              </motion.div>

              <motion.div 
                key={`btn-${currentBanner.id}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-2 shrink-0 pointer-events-auto w-full sm:w-auto mt-2 sm:mt-0"
              >
                <AnimatedButton
                  href={currentBanner.ctaLink || "/shop"}
                  accentColor="bg-red-600"
                  className="bg-red-600 hover:bg-red-700 text-white font-black text-xs py-2 sm:py-2.5 px-4 sm:px-5 shadow-xl rounded-xl"
                >
                  <span>{currentBanner.ctaText || "Shop Now"}</span>
                  <ArrowRight size={13} className="ml-1" />
                </AnimatedButton>
              </motion.div>
            </div>

          {/* Bottom Thumbnails / Pagination Dots Strip */}
          <div className="bg-black/90 border-t border-zinc-800 px-3 py-2 flex items-center justify-between gap-2 overflow-hidden">
            {/* Banner Track Selectors - scrollable on mobile */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 flex-1 min-w-0">
              {banners.map((b, idx) => {
                const isActive = idx === currentIndex
                return (
                  <button
                    key={b.id + idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-red-600 text-white shadow-md scale-105"
                        : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white shrink-0" />
                    <span>{b.title.split(" ")[0]}</span>
                    <span className="hidden sm:inline text-[10px] opacity-75 font-normal">#{idx + 1}</span>
                  </button>
                )
              })}
            </div>

            {/* Slide Counter */}
            <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
              <span className="font-mono text-[11px]">
                <strong className="text-white">{currentIndex + 1}</strong> / {banners.length}
              </span>
              <span className="hidden md:inline text-[10px] text-zinc-500">
                {isPaused ? "❚❚ Paused" : "▶ Auto"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4K Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-zinc-900 rounded-3xl border border-zinc-700 p-4 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-black text-white text-sm sm:text-base">
                {currentBanner.title} • 4K Master Graphic
              </h3>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="px-3 py-1 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:text-white font-bold"
              >
                Close ✕
              </button>
            </div>
            <div className="relative w-full h-[60vh] sm:h-[70vh] my-2">
              <Image
                src={currentBanner.imageUrl}
                alt={currentBanner.title}
                fill
                quality={100}
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
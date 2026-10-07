"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Eye, ShieldCheck, Tag } from "lucide-react"
import RevealText from "@/components/ui/reveal-text"
import AnimatedButton from "@/components/ui/animated-button"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "@/hooks/useTranslation"

interface BannerItem {
  id: string
  title: string
  subtitle: string
  badgeText: string
  ctaText: string
  ctaLink: string
  imageUrl: string
  mobileImageUrl?: string
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
    objectFit: "contain",
    isActive: true,
    sortOrder: 5,
  },
]

export default function Hero() {
  const { t } = useTranslation()
  const [banners, setBanners] = useState<BannerItem[]>(FALLBACK_BANNERS)
  const [globalFitMode, setGlobalFitMode] = useState<"contain" | "cover">("contain")
  const [bannerWidthMode, setBannerWidthMode] = useState<string>("1600")
  const [bannerHeightMode, setBannerHeightMode] = useState<string>("xl")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  // Fetch dynamic banners from Admin API
  useEffect(() => {
    fetch("/api/admin/banners", { cache: "no-store" })
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

  // Touch & Touchpad swipe tracking
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const lastWheelTime = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    const diff = touchStartX.current - touchEndX.current
    if (diff > 35) {
      handleNext()
    } else if (diff < -35) {
      handlePrev()
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now()
    if (now - lastWheelTime.current < 600) return
    if (Math.abs(e.deltaX) > 25) {
      if (e.deltaX > 25) {
        handleNext()
        lastWheelTime.current = now
      } else if (e.deltaX < -25) {
        handlePrev()
        lastWheelTime.current = now
      }
    }
  }

  // Auto-play timer: Slow, elegant auto-scroll to the right
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      handleNext()
    }, 6500)
    return () => clearInterval(timer)
  }, [banners.length, handleNext])

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
      className="relative w-full bg-zinc-950 text-white overflow-hidden select-none border-b border-zinc-800 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
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
          {/* Main Visual Slide Container:
               - Mobile (< sm): 16:9 aspect ratio capped at 260px to be readable without being huge
               - sm+: full 16:9 aspect capped at 640px
               The banner images are 2752×1536 which is 16:9. Maintaining this ratio on all devices
               ensures the full graphic text is always visible and the banner fills its container
               without cropping or letterboxing gaps. */}
          <div className="relative w-full aspect-[16/9] max-h-[260px] sm:max-h-[640px] flex items-center justify-center overflow-hidden">
            {/* Ambient blurred backdrop so any space around the image fills beautifully */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
              <Image
                src={currentBanner.imageUrl}
                alt=""
                fill
                unoptimized
                className="object-cover object-center scale-110 blur-2xl opacity-50 brightness-75"
              />
            </div>

            <Link
              href={currentBanner.ctaLink || "/shop"}
              className="relative w-full h-full block z-10 overflow-hidden"
              aria-label={`View ${currentBanner.title}`}
            >
              <motion.div
                key={currentBanner.id}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1] }}
                className="w-full h-full"
              >
                {currentBanner.mobileImageUrl ? (
                  <>
                    <Image
                      src={currentBanner.imageUrl}
                      alt={currentBanner.title}
                      fill
                      priority
                      quality={100}
                      unoptimized
                      className={`hidden md:block w-full h-full object-center transition-all duration-700 ease-out group-hover:scale-[1.005] ${effectiveFit === "cover" ? "object-cover" : "object-contain"}`}
                      sizes="100vw"
                    />
                    <Image
                      src={currentBanner.mobileImageUrl}
                      alt={currentBanner.title}
                      fill
                      priority
                      quality={100}
                      unoptimized
                      className={`md:hidden w-full h-full object-center transition-all duration-700 ease-out group-hover:scale-[1.005] ${effectiveFit === "cover" ? "object-cover" : "object-contain"}`}
                      sizes="100vw"
                    />
                  </>
                ) : (
                  <Image
                    src={currentBanner.imageUrl}
                    alt={currentBanner.title}
                    fill
                    priority
                    quality={100}
                    unoptimized
                    className={`w-full h-full object-center transition-all duration-700 ease-out group-hover:scale-[1.005] ${effectiveFit === "cover" ? "object-cover" : "object-contain"}`}
                    sizes="(max-width: 768px) 100vw, 1920px"
                  />
                )}
              </motion.div>
            </Link>

            {/* Touch and touchpad scrollable directly without arrows */}

            {/* Quick Action CTA: Visible on tablet and desktop, unobtrusive so mobile graphic text is 100% visible */}
            <div className="hidden sm:block absolute bottom-2.5 sm:bottom-4 right-3 sm:right-6 z-20 pointer-events-auto">
              <AnimatedButton
                href={currentBanner.ctaLink || "/shop"}
                accentColor="bg-red-600"
                className="bg-red-600 hover:bg-red-700 text-white font-black text-xs py-1.5 sm:py-2 px-3 sm:px-4 shadow-xl rounded-xl"
              >
                <span>{currentBanner.ctaText && currentBanner.ctaText.includes("Shop ") ? currentBanner.ctaText : t("hero.shopNow")}</span>
                <ArrowRight size={12} className="ml-1" />
              </AnimatedButton>
            </div>
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
                {isPaused ? t("hero.paused") : t("hero.auto")}
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
                {currentBanner.title} • {t("hero.masterGraphic")}
              </h3>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="px-3 py-1 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:text-white font-bold"
              >
                {t("common.close")} ✕
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
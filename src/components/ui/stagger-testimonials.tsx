"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Star,
  BadgeCheck,
  CheckCircle2,
  ShieldCheck,
  ThumbsUp,
  Sparkles,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import RevealText from "@/components/ui/reveal-text"

export interface CustomerReviewItem {
  id: string
  productId: string
  productName: string
  productSlug?: string
  rating: number
  title?: string
  body?: string
  isVerified: boolean
  createdAt: string
  customerName: string
}

export interface ReviewBreakdownItem {
  star: number
  count: number
  percentage: number
}

export interface ReviewSummary {
  averageRating: number
  totalReviews: number
  fiveStarPercentage: number
  breakdown: ReviewBreakdownItem[]
}

export interface StaggerTestimonialsProps {
  productId?: string
  productName?: string
  className?: string
  title?: string
  subtitle?: string
  showHeader?: boolean
  showSummary?: boolean
  showFilters?: boolean
  compact?: boolean
  initialReviews?: CustomerReviewItem[]
  initialSummary?: ReviewSummary
}

type FilterOption = "ALL" | "5" | "4" | "3" | "VERIFIED"

// Helper to format initials from customer name
function getInitials(name: string): string {
  if (!name) return "PX"
  const parts = name.trim().split(" ")
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

// Helper to calculate human readable time ago
function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    const weeks = Math.floor(diffDays / 7)
    if (weeks === 1) return "1 week ago"
    if (weeks < 4) return `${weeks} weeks ago`
    const months = Math.floor(diffDays / 30)
    if (months <= 1) return "1 month ago"
    return `${months} months ago`
  } catch {
    return "Recent review"
  }
}

// Consistent avatar background gradient by name
function getAvatarGradient(name: string): string {
  const gradients = [
    "from-amber-500 to-orange-600",
    "from-blue-600 to-indigo-700",
    "from-emerald-500 to-teal-700",
    "from-rose-500 to-red-600",
    "from-purple-600 to-violet-800",
    "from-cyan-600 to-blue-700",
  ]
  let sum = 0
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i)
  }
  return gradients[sum % gradients.length]
}

export default function StaggerTestimonials({
  productId,
  productName,
  className,
  title = "What Our Customers Say",
  subtitle = "Real feedback from the NUTRATEIN community",
  showHeader = true,
  showSummary = true,
  showFilters = true,
  compact = false,
  initialReviews,
  initialSummary,
}: StaggerTestimonialsProps) {
  const [reviews, setReviews] = useState<CustomerReviewItem[]>(initialReviews || [])
  const [summary, setSummary] = useState<ReviewSummary>(
    initialSummary || {
      averageRating: 0,
      totalReviews: 0,
      fiveStarPercentage: 0,
      breakdown: [
        { star: 5, count: 0, percentage: 0 },
        { star: 4, count: 0, percentage: 0 },
        { star: 3, count: 0, percentage: 0 },
        { star: 2, count: 0, percentage: 0 },
        { star: 1, count: 0, percentage: 0 },
      ],
    }
  )

  const [isLoading, setIsLoading] = useState<boolean>(!initialReviews)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterOption>("ALL")
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false)
  const [helpfulVotes, setHelpfulVotes] = useState<{ [id: string]: number }>({})
  const [userVoted, setUserVoted] = useState<{ [id: string]: boolean }>({})

  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartXRef = useRef<number>(0)
  const touchEndXRef = useRef<number>(0)

  // 1. Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
      setPrefersReducedMotion(mediaQuery.matches)

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches)
      }
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  // 2. Fetch reviews dynamically from the unified database API
  const fetchReviews = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const url = new URL("/api/reviews", window.location.origin)
      if (productId) {
        url.searchParams.set("productId", productId)
      }
      url.searchParams.set("limit", "50")

      const res = await fetch(url.toString(), { cache: "no-store" })
      if (!res.ok) {
        throw new Error(`Failed to load reviews (${res.status})`)
      }

      const data = await res.json()
      setReviews(data.reviews || [])
      if (data.summary) {
        setSummary(data.summary)
      }
    } catch (err: any) {
      console.error("Error fetching reviews:", err)
      setError("Customer reviews are temporarily unavailable. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // 3. Filter reviews based on active filter pill
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (activeFilter === "ALL") return true
      if (activeFilter === "5") return r.rating === 5
      if (activeFilter === "4") return r.rating === 4
      if (activeFilter === "3") return r.rating === 3
      if (activeFilter === "VERIFIED") return r.isVerified
      return true
    })
  }, [reviews, activeFilter])

  // Reset index when filter changes
  useEffect(() => {
    setActiveIndex(0)
  }, [activeFilter])

  // 4. Navigation handlers
  const handlePrev = useCallback(() => {
    if (filteredReviews.length === 0) return
    setActiveIndex((prev) => (prev - 1 + filteredReviews.length) % filteredReviews.length)
  }, [filteredReviews.length])

  const handleNext = useCallback(() => {
    if (filteredReviews.length === 0) return
    setActiveIndex((prev) => (prev + 1) % filteredReviews.length)
  }, [filteredReviews.length])

  // 5. Auto rotation timer (5.5 seconds)
  useEffect(() => {
    if (prefersReducedMotion || isPaused || filteredReviews.length <= 1) {
      return
    }

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filteredReviews.length)
    }, 5500)

    return () => clearInterval(timer)
  }, [isPaused, filteredReviews.length, prefersReducedMotion])

  // 6. Keyboard navigation (Left / Right Arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handlePrev, handleNext])

  // 7. Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current
    const threshold = 40
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handleNext()
      } else {
        handlePrev()
      }
    }
    touchStartXRef.current = 0
    touchEndXRef.current = 0
  }

  // Helpful vote toggle
  const handleVoteHelpful = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (userVoted[id]) return
    setUserVoted((prev) => ({ ...prev, [id]: true }))
    setHelpfulVotes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  return (
    <section
      ref={containerRef}
      aria-label="Customer Reviews"
      tabIndex={0}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className={cn(
        "relative py-12 md:py-16 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors overflow-hidden focus:outline-none",
        className
      )}
    >
      <div className="container-custom max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        {showHeader && (
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles size={12} className="text-brand-600 dark:text-brand-400" />
              <span>Verified Customer Feedback</span>
            </div>
            <RevealText
              text={title}
              as="h2"
              size="custom"
              duration={0.35}
              stagger={0.02}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white !justify-center !text-center"
            />
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </p>
          </div>
        )}

        {/* Rating Summary & Breakdown Card */}
        {showSummary && (
          <div className="card p-6 sm:p-8 bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl mb-10 max-w-4xl mx-auto shadow-sm backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left Score Box */}
              <div className="md:col-span-5 text-center md:border-r md:border-zinc-200 dark:md:border-zinc-800 md:pr-8">
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-5xl sm:text-6xl font-black text-zinc-950 dark:text-white tracking-tight">
                    {summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : "5.0"}
                  </span>
                  <span className="text-lg font-semibold text-zinc-400 dark:text-zinc-500">/ 5</span>
                </div>

                <div className="flex justify-center gap-1 my-2.5" aria-label={`Rating: ${summary.averageRating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={cn(
                        "transition-colors",
                        star <= Math.round(summary.averageRating || 5)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-zinc-200 dark:fill-zinc-800 text-zinc-200 dark:text-zinc-800"
                      )}
                    />
                  ))}
                </div>

                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Based on{" "}
                  <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                    {summary.totalReviews} verified {summary.totalReviews === 1 ? "review" : "reviews"}
                  </strong>
                </p>

                {summary.totalReviews > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                    <ShieldCheck size={12} />
                    <span>{summary.fiveStarPercentage}% 5-Star Satisfaction</span>
                  </div>
                )}
              </div>

              {/* Right Star Breakdown */}
              <div className="md:col-span-7 space-y-2 text-xs">
                {summary.breakdown.map((row) => (
                  <div key={row.star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12 text-zinc-700 dark:text-zinc-300 font-semibold">
                      <span>{row.star}</span>
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                    </div>
                    <div className="flex-1 h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-zinc-500 dark:text-zinc-400 font-medium">
                      {row.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        {showFilters && reviews.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 sm:mb-10">
            <button
              type="button"
              onClick={() => setActiveFilter("ALL")}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border",
                activeFilter === "ALL"
                  ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              All Reviews ({reviews.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("5")}
              className={cn(
                "inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border",
                activeFilter === "5"
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span>5 Star</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("4")}
              className={cn(
                "inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border",
                activeFilter === "4"
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span>4 Star</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("3")}
              className={cn(
                "inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border",
                activeFilter === "3"
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span>3 Star</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("VERIFIED")}
              className={cn(
                "inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border",
                activeFilter === "VERIFIED"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span>Verified Purchases</span>
            </button>
          </div>
        )}

        {/* Loading State: Skeleton Cards */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="card p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
                    <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
                </div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="card p-8 bg-zinc-50 dark:bg-zinc-900 border border-red-200 dark:border-red-900/40 rounded-2xl text-center max-w-xl mx-auto">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={fetchReviews}
              className="mt-4 px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredReviews.length === 0 && (
          <div className="card p-10 bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-amber-500">
              <MessageSquare size={22} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              No customer reviews yet.
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Be the first to share your NUTRATEIN experience.
            </p>
          </div>
        )}

        {/* Staggered Testimonials Showcase */}
        {!isLoading && !error && filteredReviews.length > 0 && (
          <div className="relative max-w-4xl mx-auto">
            {/* The Staggered Carousel Area */}
            <div
              className="relative min-h-[340px] sm:min-h-[300px] flex items-center justify-center px-2 py-4"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {filteredReviews.map((review, index) => {
                const total = filteredReviews.length
                // Calculate circular offset relative to activeIndex
                let offset = (index - activeIndex) % total
                if (offset > total / 2) offset -= total
                if (offset < -total / 2) offset += total

                const isCenter = offset === 0
                const isNext = offset === 1 || (total === 2 && offset === -1)
                const isPrev = offset === -1

                // Visible range: center, prev, next
                const isVisible = Math.abs(offset) <= 1

                if (!isVisible && !prefersReducedMotion) {
                  return null
                }

                // If prefersReducedMotion, only render active card without 3D translation
                if (prefersReducedMotion && !isCenter) {
                  return null
                }

                return (
                  <div
                    key={review.id}
                    onClick={() => {
                      if (!isCenter) setActiveIndex(index)
                    }}
                    style={{
                      transform: prefersReducedMotion
                        ? "none"
                        : `translateX(${offset * 40}px) scale(${isCenter ? 1 : 0.92}) rotate(${
                            offset * 2
                          }deg)`,
                      zIndex: isCenter ? 30 : 20 - Math.abs(offset),
                      opacity: isCenter ? 1 : 0.45,
                    }}
                    className={cn(
                      "w-full max-w-xl transition-all duration-500 ease-out cursor-pointer select-none",
                      isCenter ? "relative cursor-default" : "absolute pointer-events-auto"
                    )}
                  >
                    <div
                      className={cn(
                        "p-6 sm:p-7 rounded-2xl border transition-all duration-300 backdrop-blur-md flex flex-col justify-between min-h-[260px]",
                        isCenter
                          ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/60 ring-1 ring-zinc-950/5 dark:ring-white/10"
                          : "bg-zinc-50/90 dark:bg-zinc-900/80 border-zinc-200/80 dark:border-zinc-800/80 shadow-md hover:opacity-75"
                      )}
                    >
                      {/* Top Row: User Avatar & Info + Rating */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {/* Initials Badge (NO IMAGES) */}
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm bg-gradient-to-tr",
                                getAvatarGradient(review.customerName)
                              )}
                            >
                              {getInitials(review.customerName)}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-sm text-zinc-950 dark:text-white leading-tight">
                                  {review.customerName}
                                </h4>
                                {review.isVerified && (
                                  <span
                                    title="Verified Buyer"
                                    className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60"
                                  >
                                    <BadgeCheck size={11} className="text-emerald-600 dark:text-emerald-400" />
                                    <span>Verified</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                {formatTimeAgo(review.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Star Rating */}
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={cn(
                                  star <= review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-zinc-200 dark:fill-zinc-800 text-zinc-200 dark:text-zinc-800"
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Review Title */}
                        {review.title && (
                          <h5 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1.5 leading-snug">
                            {review.title}
                          </h5>
                        )}

                        {/* Review Body */}
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                          "{review.body}"
                        </p>
                      </div>

                      {/* Bottom Footer: Product Tag & Helpful Button */}
                      <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium truncate max-w-[200px] sm:max-w-xs">
                          {review.productName}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleVoteHelpful(review.id, e)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors",
                            userVoted[review.id]
                              ? "bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          )}
                        >
                          <ThumbsUp size={11} />
                          <span>Helpful {helpfulVotes[review.id] ? `(${helpfulVotes[review.id]})` : ""}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Controls: Prev / Next Buttons & Indicator Dots */}
            <div className="flex items-center justify-between mt-6 px-2">
              <button
                type="button"
                aria-label="Previous customer review"
                onClick={handlePrev}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Indicator Dots */}
              <div className="flex items-center gap-1.5">
                {filteredReviews.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    aria-label={`Go to review ${dotIdx + 1}`}
                    onClick={() => setActiveIndex(dotIdx)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300 focus:outline-none",
                      dotIdx === activeIndex
                        ? "w-6 bg-zinc-950 dark:bg-white"
                        : "w-2 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
                    )}
                  />
                ))}
              </div>

              <button
                type="button"
                aria-label="Next customer review"
                onClick={handleNext}
                className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

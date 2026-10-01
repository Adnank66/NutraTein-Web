"use client"

import { useState } from "react"
import {
  Star,
  Search,
  CheckCircle2,
  Trash2,
  Filter,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"

export interface ReviewItem {
  id: string
  rating: number
  title?: string | null
  body?: string | null
  isVerified: boolean
  createdAt: string | Date
  product?: { id: string; name: string; slug: string } | null
  user?: { id: string; name?: string | null; email?: string | null } | null
}

const DEMO_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    rating: 5,
    title: "Best Whey Isolate in India! Unmatched mixability",
    body: "Results within 3 weeks of consistent intake. Zero bloating and taste is phenomenal with cold milk. Highly recommended!",
    isVerified: true,
    createdAt: new Date().toISOString(),
    product: { id: "p1", name: "Nitro-Tein Whey Isolate", slug: "nitro-tein-whey-isolate" },
    user: { id: "u1", name: "Vikram Malhotra", email: "vikram.m@gmail.com" },
  },
  {
    id: "rev-2",
    rating: 5,
    title: "Insane pump & laser focus on heavy lifts",
    body: "Titan Pump gives clean energy with zero crash. Hit PR on bench press yesterday. 10/10 supplement.",
    isVerified: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    product: { id: "p2", name: "Titan Pump Pre-Workout", slug: "titan-pump-preworkout" },
    user: { id: "u2", name: "Rohit Deshmukh", email: "rohit.d@gmail.com" },
  },
  {
    id: "rev-3",
    rating: 4,
    title: "Solid creatine monohydrate, pure & micronized",
    body: "Dissolves well in warm water or whey shake. Strength gains visible in 2 weeks of loading phase.",
    isVerified: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    product: { id: "p3", name: "CreaCore Micronized Creatine", slug: "creacore-creatine" },
    user: { id: "u3", name: "Kunal Verma", email: "kunal.v@gmail.com" },
  },
  {
    id: "rev-4",
    rating: 5,
    title: "Gained 3.5kg clean mass without fat accumulation",
    body: "Mass Surge gainer is great for hardgainers. Digestion friendly enzymes keep stomach calm.",
    isVerified: false,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    product: { id: "p4", name: "Mass Surge Extreme Gainer", slug: "mass-surge-extreme" },
    user: { id: "u4", name: "Deepak Rawat", email: "deepak.r@outlook.com" },
  },
  {
    id: "rev-5",
    rating: 3,
    title: "Good results but Belgian Chocolate was slightly sweet",
    body: "Quality and protein content is genuine, just found flavor a bit sweeter than anticipated.",
    isVerified: true,
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    product: { id: "p1", name: "Nitro-Tein Whey Isolate", slug: "nitro-tein-whey-isolate" },
    user: { id: "u5", name: "Arjun Nair", email: "arjun.nair@gmail.com" },
  },
]

export default function ReviewsManager({ initialReviews = [] }: { initialReviews?: ReviewItem[] }) {
  const [reviews, setReviews] = useState<ReviewItem[]>(
    initialReviews.length > 0 ? initialReviews : DEMO_REVIEWS
  )
  const [search, setSearch] = useState("")
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL")
  const [verifiedFilter, setVerifiedFilter] = useState<"ALL" | "VERIFIED">("ALL")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredReviews = reviews.filter((r) => {
    const matchSearch =
      (r.product?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.body || "").toLowerCase().includes(search.toLowerCase())

    const matchRating = ratingFilter === "ALL" || r.rating === ratingFilter
    const matchVerified = verifiedFilter === "ALL" || (verifiedFilter === "VERIFIED" && r.isVerified)

    return matchSearch && matchRating && matchVerified
  })

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0"

  const toggleVerified = async (reviewId: string, current: boolean) => {
    try {
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, isVerified: !current } : r))
      )
      await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId, isVerified: !current }),
      })
      toast.success(`Review ${!current ? "marked as Verified Buyer" : "unverified"}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to permanently delete this customer review?")) return
    setDeletingId(reviewId)

    try {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
      await fetch(`/api/admin/reviews?id=${reviewId}`, { method: "DELETE" })
      toast.success("Customer review deleted permanently")
    } catch {
      toast.error("Failed to delete review")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Star size={24} className="text-amber-500 fill-amber-500" />
            Customer Reviews & Ratings Moderation ({reviews.length})
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Audit, verify authentic buyers, moderate testimonials, and manage product feedback across your store.
          </p>
        </div>

        {/* Global Rating Badge */}
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Store Average</p>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-xl font-black text-zinc-900 dark:text-white">{averageRating}</span>
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill="currentColor" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by customer, product, or review text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Rating Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            {(["ALL", 5, 4, 3, 2, 1] as const).map((star) => (
              <button
                key={String(star)}
                onClick={() => setRatingFilter(star as any)}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                  ratingFilter === star
                    ? "bg-brand-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {star === "ALL" ? "All" : `${star}★`}
              </button>
            ))}
          </div>

          {/* Verified Filter */}
          <button
            onClick={() => setVerifiedFilter(verifiedFilter === "ALL" ? "VERIFIED" : "ALL")}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
              verifiedFilter === "VERIFIED"
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <ShieldCheck size={14} />
            Verified Only
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="card p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <MessageSquare size={36} className="mx-auto text-zinc-400 mb-2 opacity-50" />
            <p className="font-bold text-sm text-zinc-700 dark:text-zinc-300">No matching reviews found</p>
            <p className="text-xs text-zinc-400 mt-1">Try resetting your filters or search keywords.</p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
            >
              <div className="space-y-2 flex-1">
                {/* Product Name & Date */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-0.5 rounded-md border border-brand-200/60 dark:border-brand-800/60">
                    {rev.product?.name || "Supplement"}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {rev.isVerified && (
                    <span className="badge text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Verified Buyer
                    </span>
                  )}
                </div>

                {/* Stars and Title */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < rev.rating ? "currentColor" : "none"}
                          className={i < rev.rating ? "text-amber-500" : "text-zinc-300 dark:text-zinc-700"}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-black text-zinc-900 dark:text-white">
                      {rev.rating}.0
                    </span>
                  </div>
                  {rev.title && (
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{rev.title}</h3>
                  )}
                  {rev.body && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                      "{rev.body}"
                    </p>
                  )}
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {rev.user?.name || "Customer"}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-[10px]">{rev.user?.email || "verified-order@proteinx.in"}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-start shrink-0 pt-2 md:pt-0">
                <button
                  onClick={() => toggleVerified(rev.id, rev.isVerified)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    rev.isVerified
                      ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                      : "bg-emerald-600 text-white border-transparent hover:bg-emerald-500 shadow-sm"
                  }`}
                  title="Toggle Verified Customer status"
                >
                  {rev.isVerified ? "Revoke Badge" : "✓ Mark Verified"}
                </button>

                <button
                  onClick={() => handleDelete(rev.id)}
                  disabled={deletingId === rev.id}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
                  title="Delete review"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

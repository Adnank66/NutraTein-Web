"use client"
import { useState, useEffect } from "react"
import { Star, CheckCircle, XCircle, Trash2, Edit2, Save, X, MessageSquare } from "lucide-react"
import { toast } from "sonner"

interface Review {
  id: string
  rating: number
  title: string | null
  body: string | null
  status: string
  isVerified: boolean
  createdAt: string
  user: { name: string | null; email: string }
  product: { name: string; slug: string }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300 dark:text-zinc-600"}
        />
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ title: "", body: "" })

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/reviews")
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch {
      toast.error("Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReviews() }, [])

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      toast.success(`Review ${status.toLowerCase()}`)
      fetchReviews()
    } else {
      toast.error("Failed to update")
    }
  }

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return
    const res = await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success("Review deleted"); fetchReviews() }
    else toast.error("Failed to delete")
  }

  const saveEdit = async () => {
    if (!editingId) return
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...editData }),
    })
    if (res.ok) { toast.success("Review updated"); setEditingId(null); fetchReviews() }
    else toast.error("Failed to update")
  }

  const filtered = filter === "ALL" ? reviews : reviews.filter(r => r.status === filter)
  const pending = reviews.filter(r => r.status === "PENDING").length
  const approved = reviews.filter(r => r.status === "APPROVED").length
  const rejected = reviews.filter(r => r.status === "REJECTED").length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
            <MessageSquare className="text-amber-600 dark:text-amber-400" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Review Manager</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Approve, edit or reject customer reviews before they appear on the store
            </p>
          </div>
        </div>
        {pending > 0 && (
          <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl animate-pulse">
            {pending} pending review{pending > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{pending}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{approved}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Approved</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{rejected}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Rejected</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["PENDING", "ALL", "APPROVED", "REJECTED"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filter === f
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {f === "ALL" ? `All (${reviews.length})` : f === "PENDING" ? `Pending (${pending})` : f === "APPROVED" ? `Approved (${approved})` : `Rejected (${rejected})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400 dark:text-zinc-500">Loading reviews...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No reviews in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div
              key={review.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <StarRating rating={review.rating} />
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        review.status === "APPROVED"
                          ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                          : review.status === "REJECTED"
                          ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
                          : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {review.status}
                    </span>
                    {review.isVerified && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {editingId === review.id ? (
                    <div className="space-y-2">
                      <input
                        value={editData.title}
                        onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
                        placeholder="Review title"
                        className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                      <textarea
                        value={editData.body}
                        onChange={e => setEditData(p => ({ ...p, body: e.target.value }))}
                        rows={3}
                        placeholder="Review body"
                        className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="flex items-center gap-1 bg-brand-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                        >
                          <Save size={12} /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-3 py-1.5 rounded-lg"
                        >
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {review.title && (
                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{review.title}</p>
                      )}
                      {review.body && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{review.body}</p>
                      )}
                      {!review.title && !review.body && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-600 italic">No review text</p>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-3 flex-wrap text-[10px] text-zinc-400 dark:text-zinc-500">
                    <span>By: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{review.user.name || review.user.email}</span></span>
                    <span>•</span>
                    <span>Product: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{review.product.name}</span></span>
                    <span>•</span>
                    <span>{new Date(review.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  {review.status !== "APPROVED" && (
                    <button
                      onClick={() => updateStatus(review.id, "APPROVED")}
                      className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 whitespace-nowrap"
                    >
                      <CheckCircle size={12} /> Approve
                    </button>
                  )}
                  {review.status !== "REJECTED" && (
                    <button
                      onClick={() => updateStatus(review.id, "REJECTED")}
                      className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 whitespace-nowrap"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  )}
                  {review.status === "PENDING" && (
                    <button
                      onClick={() => {
                        setEditingId(review.id)
                        setEditData({ title: review.title || "", body: review.body || "" })
                      }}
                      className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

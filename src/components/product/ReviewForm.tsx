"use client"
import { useState } from "react"
import { Star, CheckCircle, ThumbsUp } from "lucide-react"
import { toast } from "sonner"

export default function ReviewForm({ productId, reviews = [] }: { productId: string; reviews?: any[] }) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body || body.length < 10) {
      toast.error("Please provide at least 10 characters in your review.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title, body }),
      })
      if (!res.ok) throw new Error("Failed to submit review")
      setSubmitted(true)
      toast.success("Thank you! Your verified review has been recorded.")
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review. Try logging in first.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Existing Reviews List if any */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900">Verified Customer Reviews ({reviews.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r: any) => (
              <div key={r.id} className="card p-5 bg-white border border-zinc-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Recent"}
                  </span>
                </div>
                {r.title && <p className="font-bold text-zinc-900">{r.title}</p>}
                <p className="text-zinc-600 leading-relaxed">{r.body}</p>
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-zinc-800 flex items-center gap-1">
                    {r.user?.name || "Verified Athlete"} <CheckCircle size={12} className="text-emerald-600" />
                  </span>
                  <span className="text-zinc-400">Verified Purchase</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Submission Form */}
      {submitted ? (
        <div className="card p-6 bg-emerald-50/50 border border-emerald-200 text-center">
          <p className="font-bold text-emerald-800 text-sm">Review Submitted Successfully!</p>
          <p className="text-xs text-emerald-600 mt-1">Your feedback helps fellow athletes choose the right nutrition.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 bg-white border border-zinc-200 space-y-4 max-w-xl">
          <h3 className="font-bold text-zinc-900 text-base">Write a Customer Review</h3>

          <div>
            <label className="label">Rating</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    size={22}
                    className={star <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-zinc-200"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Headline</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clean formula, noticeable recovery support"
              className="input text-xs"
            />
          </div>

          <div>
            <label className="label">Review Details</label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe mixability, taste, recovery, and results..."
              className="input text-xs resize-none"
              required
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary text-xs py-2.5 px-6 font-bold">
            {isSubmitting ? "Submitting..." : "Submit Verified Review"}
          </button>
        </form>
      )}
    </div>
  )
}
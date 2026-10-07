"use client"
import { useState } from "react"
import StoreLayout from "@/components/layout/StoreLayout"
import { Star, Send, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function WriteReviewPage() {
  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    body: "",
    name: "",
    email: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.body || !formData.name || !formData.email) {
      toast.error("Please fill in all required fields.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/site-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSubmitted(true)
        toast.success("Review submitted successfully!")
      } else {
        throw new Error(data.error || "Failed to submit review")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <StoreLayout>
      <div className="py-16 bg-zinc-50/50 dark:bg-zinc-950 min-h-[75vh]">
        <div className="container-custom max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Customer Feedback</span>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 dark:text-white">Write a Review</h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Share your experience with NUTRATEIN. Your feedback helps us improve and helps others make better choices.
            </p>
          </div>

          <div className="card p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Thank you for your review!</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Your review has been submitted and is pending approval by our moderators. It will appear on the site shortly.
                </p>
                <div className="pt-4">
                  <Link href="/" className="btn-secondary text-xs inline-block">
                    Return to Home
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="label block text-center mb-3">Rate your experience *</label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          size={32}
                          className={star <= (hoverRating || formData.rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-200 dark:text-zinc-700"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="label">Your Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="input text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Review Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="E.g., Great products and fast shipping!"
                    className="input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="label">Review Details *</label>
                  <textarea
                    rows={5}
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Tell us what you liked or what we could improve..."
                    className="input text-xs resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 px-6 text-sm font-bold shadow-lg shadow-brand-500/15 flex items-center justify-center gap-2"
                >
                  {loading ? "Submitting..." : <><Send size={16} /> Submit Review</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}

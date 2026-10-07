"use client"
import { useState, useEffect } from "react"
import { Star, Quote, Plus, X } from "lucide-react"
import { toast } from "sonner"

const STATIC_REVIEWS = [
  {
    name: "Vikram Malhotra",
    role: "National Powerlifter",
    rating: 5,
    product: "100% Gold Whey Isolate",
    text: "PROTEINX Gold Whey Isolate is without question the cleanest protein in the Indian market. Instant mixing with zero froth or gut discomfort. Hit my personal deadlift PR of 240kg on this nutrition!",
  },
  {
    name: "Ananya Iyer",
    role: "Marathon Runner & Fitness Coach",
    rating: 5,
    product: "HydroFuel BCAA + EAA",
    text: "Intra-workout hydration with the Himalayan electrolytes makes an immense difference in long distance training. No cramping and my next-day DOMS is virtually gone.",
  },
  {
    name: "Rohit Deshmukh",
    role: "CrossFit Athlete",
    rating: 5,
    product: "HyperDrive Pre-Workout",
    text: "Insane pump and laser focus without any heart palpitations or caffeine crash. Taste is crisp and natural. Highly recommend to anyone doing intense conditioning.",
  },
]

export default function Testimonials() {
  const [reviews, setReviews] = useState<any[]>(STATIC_REVIEWS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: "", role: "Verified Buyer", rating: 5, product: "", text: "" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch("/api/site-reviews")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.reviews && d.reviews.length > 0) {
          setReviews([...d.reviews, ...STATIC_REVIEWS])
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/site-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("Review submitted successfully! It will appear once approved by our team.")
        setIsModalOpen(false)
        setFormData({ name: "", role: "Verified Buyer", rating: 5, product: "", text: "" })
      } else {
        toast.error("Failed to submit review.")
      }
    } catch {
      toast.error("Network error.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="py-16 bg-dark-50">
      <div className="container-custom">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Community Feedback</span>
          <h2 className="section-title mt-1">Real Reviews from Real Athletes</h2>
          <p className="section-subtitle">Verified customer stories and training experiences.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all"
          >
            <Plus size={16} /> Write a Review
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.slice(0, 6).map((r, idx) => (
            <div key={idx} className="card p-6 flex flex-col justify-between hover:shadow-md transition-all bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={15} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <Quote size={20} className="text-brand-300 dark:text-zinc-700" />
                </div>
                <p className="text-sm text-dark-700 dark:text-zinc-300 leading-relaxed italic mb-6">"{r.text}"</p>
              </div>

              <div className="pt-4 border-t border-dark-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-dark-900 dark:text-white text-sm">{r.name}</p>
                  <p className="text-xs text-dark-400 dark:text-zinc-500">{r.role}</p>
                </div>
                <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded">
                  {r.product}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Share Your Experience</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-full transition">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Your Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" placeholder="John Doe" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Favorite Product</label>
                  <input required type="text" value={formData.product} onChange={e => setFormData({...formData, product: e.target.value})} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" placeholder="E.g. Gold Whey" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Rating</label>
                  <select value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">
                    <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value="4">⭐⭐⭐⭐ (4/5)</option>
                    <option value="3">⭐⭐⭐ (3/5)</option>
                    <option value="2">⭐⭐ (2/5)</option>
                    <option value="1">⭐ (1/5)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Your Review</label>
                <textarea required rows={4} value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none" placeholder="Tell us what you loved..."></textarea>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

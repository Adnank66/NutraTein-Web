"use client"
import { useState } from "react"
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function Newsletter() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.")
      return
    }
    setSubscribed(true)
    toast.success("Welcome to the PROTEINX Crew! Check your inbox for ₹200 discount code.")
  }

  return (
    <section className="py-16 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">Join the PROTEINX VIP Club</h2>
          <p className="text-brand-100 text-base max-w-xl mx-auto mb-8">
            Get 10% off your first order, exclusive flash sale alerts, and science-backed fitness nutrition tips.
          </p>

          {subscribed ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 inline-flex items-center gap-3 border border-white/20">
              <CheckCircle2 size={24} className="text-green-300" />
              <p className="font-semibold text-sm">You are on the VIP list! Coupon FIRST10 unlocked.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-1 px-4 py-3.5 rounded-xl text-dark-900 text-sm outline-none focus:ring-2 focus:ring-white"
                required
              />
              <button
                type="submit"
                className="bg-dark-950 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-dark-900 transition-all flex items-center justify-center gap-2 text-sm shrink-0"
              >
                Subscribe <ArrowRight size={16} />
              </button>
            </form>
          )}

          <p className="text-xs text-brand-200 mt-4">We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </div>
    </section>
  )
}

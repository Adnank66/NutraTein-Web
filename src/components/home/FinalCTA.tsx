"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Mail, CheckCircle2, Zap } from "lucide-react"
import { toast } from "sonner"
import RevealText from "@/components/ui/reveal-text"

export default function FinalCTA() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    toast.success("Welcome to PROTEINX Club!", {
      description: "Check your inbox for your 10% welcome coupon code.",
    })
  }

  return (
    <section className="py-20 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
      <div className="container-custom">
        <div
          className="relative bg-gradient-to-br from-red-950/60 via-zinc-900 to-zinc-950 rounded-3xl text-white p-8 sm:p-14 overflow-hidden border border-zinc-800 text-center shadow-2xl"
        >
          {/* Subtle glow */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-brand-400 text-xs font-bold">
              <Zap size={13} fill="currentColor" />
              <span>START YOUR TRANSFORMATION</span>
            </div>

            <RevealText
              text="Ready to Fuel Your Fitness Journey?"
              as="h2"
              size="custom"
              duration={0.35}
              stagger={0.02}
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight !justify-center !text-center"
            />

            <p className="text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              Join over 50,000 athletes who rely on PROTEINX for pure, certified formulas and uncompromised results.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/shop" className="btn-primary w-full sm:w-auto py-3.5 px-8 text-sm font-bold shadow-lg shadow-brand-500/20">
                Shop Formulas Now <ArrowRight size={16} />
              </Link>
              <Link href="/#combos" className="btn-secondary w-full sm:w-auto py-3.5 px-8 text-sm font-semibold bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800">
                Build Your Stack
              </Link>
            </div>

            {/* Newsletter input */}
            <div className="pt-8 border-t border-zinc-800 max-w-md mx-auto">
              <p className="text-xs text-zinc-400 mb-3 font-medium">Subscribe for workout nutrition guides & VIP sales:</p>
              {subscribed ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl">
                  <CheckCircle2 size={16} />
                  <span>You're subscribed! Use code FIRST10 on your order.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email..."
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-brand-500"
                    required
                  />
                  <button type="submit" className="btn-primary text-xs px-4 py-2.5 shrink-0 font-bold">
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
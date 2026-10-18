import type { Metadata } from "next"
import Link from "next/link"
import StoreLayout from "@/components/layout/StoreLayout"
import { CheckCircle2, ShoppingBag, Truck, Home, ArrowRight, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Thank You",
  description: "Thank you for reaching out to NUTRA TEIN. We have received your inquiry.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ThankYouPage() {
  return (
    <StoreLayout>
      <div className="py-20 bg-zinc-50 dark:bg-zinc-950 min-h-[75vh] flex items-center justify-center transition-colors">
        <div className="container-custom max-w-xl text-center space-y-8 px-4">
          {/* Animated Success Badge */}
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400 animate-scale-in" />
          </div>

          {/* Heading & Confirmation */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Submission Received
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 dark:text-white tracking-tight">
              Thank You! We're On It.
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Your message has been sent directly to our support desk. A supplement specialist will review your inquiry and get back to you within 24 business hours.
            </p>
          </div>

          {/* What Happens Next Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left space-y-3 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-brand-600" />
              What Happens Next
            </h2>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                <span>We inspect your query regarding formulation, order status, or delivery.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                <span>You will receive an email response or WhatsApp notification at the details you provided.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                <span>For urgent order assistance, please have your order number ready when tracking.</span>
              </li>
            </ul>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5"
            >
              <ShoppingBag size={15} />
              Continue Shopping
            </Link>
            <Link
              href="/track"
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all hover:-translate-y-0.5"
            >
              <Truck size={15} />
              Track Existing Order
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all"
            >
              <Home size={15} />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}

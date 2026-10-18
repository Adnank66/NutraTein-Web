import Link from "next/link"
import StoreLayout from "@/components/layout/StoreLayout"
import { Home, ShoppingBag, Tag, Search, ArrowRight, Truck, LifeBuoy } from "lucide-react"

export default function NotFound() {
  return (
    <StoreLayout>
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* 404 Visual Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
            <span>Error 404</span>
            <span className="w-1 h-1 rounded-full bg-red-500" />
            <span>Page Not Found</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl font-black text-zinc-950 dark:text-white tracking-tight">
              Lost in the Stack?
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
              The supplement, deal, or page you were looking for has been moved, renamed, or doesn't exist. Let's get you back on track to hitting your fitness goals.
            </p>
          </div>

          {/* Direct Actions */}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5"
            >
              <Home size={16} />
              Return to Homepage
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all hover:-translate-y-0.5"
            >
              <ShoppingBag size={16} />
              Browse All Supplements
            </Link>
          </div>

          {/* Helpful Navigation Cards */}
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
              Helpful Destinations
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <Link
                href="/deals"
                className="group p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 dark:hover:border-red-500/50 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <Tag size={16} />
                  </div>
                  <ArrowRight size={14} className="text-zinc-400 group-hover:text-red-500 transition-colors" />
                </div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Deals & Offers</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Save on performance stacks</p>
              </Link>

              <Link
                href="/track"
                className="group p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 dark:hover:border-red-500/50 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Truck size={16} />
                  </div>
                  <ArrowRight size={14} className="text-zinc-400 group-hover:text-red-500 transition-colors" />
                </div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Track Order</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Check courier delivery status</p>
              </Link>

              <Link
                href="/contact"
                className="group p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/50 dark:hover:border-red-500/50 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <LifeBuoy size={16} />
                  </div>
                  <ArrowRight size={14} className="text-zinc-400 group-hover:text-red-500 transition-colors" />
                </div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Customer Support</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Need help with an inquiry?</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}

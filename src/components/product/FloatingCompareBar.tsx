"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeftRight, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { useCompareStore } from "@/store/compare"

export default function FloatingCompareBar() {
  const { items, removeItem, clearCompare } = useCompareStore()
  const [minimized, setMinimized] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || items.length === 0) return null

  return (
    <aside
      aria-label="Floating Product Comparison"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl transition-all duration-300 animate-slide-up"
    >
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-3 sm:p-4 text-zinc-900 dark:text-white">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600/10 text-brand-600 flex items-center justify-center">
              <ArrowLeftRight size={15} />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Compare Products ({items.length}/4)
              </span>
              <span className="hidden sm:inline text-[11px] text-zinc-400 ml-2">
                {items.length < 2 ? "Add at least 1 more product to compare" : "Ready to compare side-by-side"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (items.length > 0) removeItem(items[items.length - 1].id)
              }}
              className="px-2 py-1 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-[11px] font-semibold flex items-center gap-1"
              title="Clear one item from comparison"
            >
              <X size={12} />
              <span>Clear One</span>
            </button>
            <button
              onClick={clearCompare}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Clear all comparison items"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={() => setMinimized(!minimized)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={minimized ? "Expand compare drawer" : "Minimize compare drawer"}
            >
              {minimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {!minimized && (
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            {/* Slots */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              {[0, 1, 2, 3].map((index) => {
                const item = items[index]
                if (item) {
                  return (
                    <div
                      key={item.id}
                      className="relative w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-1 shrink-0 group"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="object-contain w-full h-full"
                      />
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-900 text-white hover:bg-rose-600 flex items-center justify-center shadow transition-colors"
                        title={`Remove ${item.name}`}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )
                }
                return (
                  <div
                    key={`empty-${index}`}
                    className="w-12 h-12 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400 shrink-0 select-none"
                  >
                    +{index + 1}
                  </div>
                )
              })}
            </div>

            {/* CTA */}
            <div className="shrink-0 flex items-center gap-2">
              <Link
                href="/compare"
                className={`btn-primary py-2 px-4 text-xs font-bold whitespace-nowrap shadow-md ${
                  items.length < 2 ? "opacity-75" : ""
                }`}
              >
                Compare Now ({items.length})
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

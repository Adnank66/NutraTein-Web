"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Search, X, TrendingUp, Clock, Sparkles, ArrowRight } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface SmartSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const popularSearches = [
  "Whey Protein Isolate",
  "Creatine Monohydrate",
  "Pre-Workout Energy",
  "Plant Protein",
  "Mass Gainer",
  "Muscle Stack"
]

export default function SmartSearchModal({ isOpen, onClose }: SmartSearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("proteinx_recent_searches")
      if (saved) setRecentSearches(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => { document.body.style.overflow = "unset" }
  }, [isOpen])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        setResults(data.products || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  const handleSearchSubmit = (searchTerm: string) => {
    const term = searchTerm.trim()
    if (!term) return
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    try {
      localStorage.setItem("proteinx_recent_searches", JSON.stringify(updated))
    } catch {}
    onClose()
    window.location.href = `/search?q=${encodeURIComponent(term)}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-scale-in">
        <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
          <Search size={20} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(query)}
            placeholder="Search supplements, whey protein, creatine, flavors..."
            className="w-full text-sm sm:text-base text-zinc-900 placeholder:text-zinc-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 text-zinc-400 hover:text-zinc-600">
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="py-8 text-center text-xs text-zinc-400 animate-pulse">
              Searching certified formula catalog...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-8 text-center space-y-1">
              <p className="text-sm font-semibold text-zinc-700">No supplements found for "{query}"</p>
              <p className="text-xs text-zinc-400">Try searching for "Whey", "Creatine", "Pre-workout", or "Mass Gainer".</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Results</span>
                <button
                  onClick={() => handleSearchSubmit(query)}
                  className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-zinc-100">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    href={`/shop/${p.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between py-2.5 px-2 hover:bg-zinc-50 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
                        <Sparkles size={14} className="text-brand-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 group-hover:text-brand-600 truncate">{p.name}</p>
                        <p className="text-[11px] text-zinc-400 uppercase">{p.brand}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-zinc-900 shrink-0">{formatPrice(p.basePrice)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!query && (
            <div className="space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2">
                    <Clock size={12} /> Recent Searches
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSearchSubmit(s)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2">
                  <TrendingUp size={12} className="text-brand-500" /> Trending Searches
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {popularSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSearchSubmit(s)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-brand-50 hover:text-brand-700 text-zinc-700 border border-zinc-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
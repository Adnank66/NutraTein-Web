"use client"
import { useEffect, useState } from "react"

export default function GlobalLoader() {
  const [loading, setLoading] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Wait for initial render, then trigger smooth fade out
    const timer1 = setTimeout(() => {
      setFading(true)
    }, 1500) // Show logo for 1.5s
    const timer2 = setTimeout(() => {
      setLoading(false)
    }, 2200) // Unmount after fade finishes

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  if (!loading) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
        fading ? "opacity-0 pointer-events-none blur-sm" : "opacity-100 blur-none"
      }`}
    >
      <div className={`flex flex-col items-center justify-center transition-transform duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${fading ? "scale-110 translate-y-[-20px]" : "scale-100 translate-y-0"}`}>
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center font-black text-white text-3xl shadow-[0_0_40px_rgba(2ea,88,12,0.4)] animate-pulse relative">
          NX
          <div className="absolute inset-0 rounded-3xl border-2 border-brand-400 animate-ping opacity-20"></div>
        </div>
        <h1 className="mt-6 text-xl sm:text-2xl font-black text-white tracking-tight uppercase" style={{ fontFeatureSettings: '"rlig" 1, "calt" 1' }}>
          PROTEIN<span className="text-brand-500">X</span>
        </h1>
        <p className="mt-2 text-xs font-bold text-zinc-400 tracking-[0.2em] uppercase">
          Initializing Store...
        </p>
      </div>
    </div>
  )
}

"use client"
import { useState } from "react"
import { X, Sparkles } from "lucide-react"

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="bg-zinc-950 text-zinc-100 text-xs py-2 px-4 text-center relative border-b border-zinc-800">
      <div className="container-custom flex items-center justify-center gap-2">
        <Sparkles size={13} className="text-amber-400 shrink-0" />
        <p className="font-medium tracking-wide">
          <span>FREE EXPRESS SHIPPING ON ORDERS OVER ₹999</span>
          <span className="hidden sm:inline mx-2 text-zinc-600">|</span>
          <span className="hidden sm:inline text-zinc-300">Use code <strong className="text-white underline decoration-brand-500 font-bold">FIRST10</strong> for 10% off</span>
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
        aria-label="Close banner"
      >
        <X size={14} />
      </button>
    </div>
  )
}
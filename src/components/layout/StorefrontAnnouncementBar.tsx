"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, Sparkles, ShieldCheck } from "lucide-react"

interface RibbonItem {
  id: string
  enabled: boolean
  text: string
  badge?: string
  link?: string
  bgColor?: string
  textColor?: string
}

const DEFAULT_FALLBACK_RIBBONS: RibbonItem[] = [
  {
    id: "ribbon-1",
    enabled: true,
    text: "⚡ Flash Sale: 20% off all supplements | Use code 'PROTEIN20' | Free express shipping over ₹999",
    badge: "LIMITED TIME",
    link: "/shop",
    bgColor: "bg-red-600",
  },
  {
    id: "ribbon-2",
    enabled: true,
    text: "🛡️ 100% Authentic Indian batch lab-certified | Zero amino spiking | Hassle-free 7-day replacements",
    badge: "LAB CERTIFIED",
    link: "/about",
    bgColor: "bg-zinc-950",
  },
]

export default function StorefrontAnnouncementBar() {
  const [ribbons, setRibbons] = useState<RibbonItem[]>(DEFAULT_FALLBACK_RIBBONS)
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({})
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetch("/api/admin/announcement", { cache: "no-store" })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.ribbons && Array.isArray(resData.ribbons) && resData.ribbons.length > 0) {
          setRibbons(resData.ribbons)
        } else if (resData.settings) {
          const s = resData.settings
          const list: RibbonItem[] = []
          if (s.announcementPrimary || s.announcement) {
            const p = s.announcementPrimary || s.announcement
            list.push({ id: "ribbon-1", ...p })
          }
          if (s.announcementSecondary) {
            list.push({ id: "ribbon-2", ...s.announcementSecondary })
          }
          if (list.length > 0) setRibbons(list)
        }
      })
      .catch(() => {})
  }, [])

  const activeRibbons = ribbons.filter((r) => r.enabled && r.text && !dismissedIds[r.id])

  useEffect(() => {
    if (activeRibbons.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeRibbons.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [activeRibbons.length])

  if (activeRibbons.length === 0) {
    return null
  }

  const currentRibbon = activeRibbons[currentIndex % activeRibbons.length]

  return (
    <div className="relative z-50 w-full font-sans transition-all duration-300">
      <div
        key={currentRibbon.id}
        className={`relative ${currentRibbon.bgColor || "bg-red-600"} text-white py-2 px-4 text-xs font-medium shadow-xs transition-colors`}
      >
        <div className="container-custom flex items-center justify-between gap-3">
          <div className="flex-1 flex items-center justify-center gap-2 text-center truncate">
            {currentRibbon.badge && (
              <span className="text-[10px] font-black uppercase bg-black/25 px-2 py-0.5 rounded-full tracking-wider shrink-0">
                {currentRibbon.badge}
              </span>
            )}
            <Link href={currentRibbon.link || "/shop"} className="hover:underline truncate flex items-center gap-1">
              <span className="truncate">{currentRibbon.text}</span>
              <span className="opacity-90 font-bold ml-1 hidden sm:inline shrink-0">Shop Now →</span>
            </Link>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {activeRibbons.length > 1 && (
              <span className="text-[10px] opacity-75 font-mono hidden md:inline mr-1">
                {((currentIndex % activeRibbons.length) + 1)}/{activeRibbons.length}
              </span>
            )}
            <button
              onClick={() => setDismissedIds((prev) => ({ ...prev, [currentRibbon.id]: true }))}
              className="text-white/80 hover:text-white p-1 rounded-md hover:bg-black/10 transition-colors"
              aria-label="Close announcement bar"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

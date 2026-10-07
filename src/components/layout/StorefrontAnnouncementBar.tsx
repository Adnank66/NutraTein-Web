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
    text: "⚡ FLASH SALE: 20% OFF ALL SUPPLEMENTS | USE CODE 'PROTEIN20' | FREE EXPRESS SHIPPING OVER ₹999",
    badge: "LIMITED TIME",
    link: "/shop",
    bgColor: "bg-red-600",
  },
  {
    id: "ribbon-2",
    enabled: true,
    text: "🛡️ 100% AUTHENTIC INDIAN BATCH LAB CERTIFIED | NO AMINO SPIKING | HASSLE-FREE 7-DAY REPLACEMENTS",
    badge: "LAB CERTIFIED",
    link: "/about",
    bgColor: "bg-zinc-950",
  },
]

export default function StorefrontAnnouncementBar() {
  const [ribbons, setRibbons] = useState<RibbonItem[]>(DEFAULT_FALLBACK_RIBBONS)
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({})

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

  if (activeRibbons.length === 0) {
    return null
  }

  return (
    <div className="relative z-50 flex flex-col font-sans transition-all duration-300 divide-y divide-white/10">
      {activeRibbons.map((ribbon, idx) => (
        <div
          key={ribbon.id || idx}
          className={`relative ${ribbon.bgColor || "bg-red-600"} text-white py-1.5 px-4 text-[11px] font-semibold shadow-xs transition-colors`}
        >
          <div className="container-custom flex items-center justify-between gap-3">
            <div className="flex-1 flex items-center justify-center gap-2 text-center truncate">
              {ribbon.badge && (
                <span className="text-[9px] font-black uppercase bg-black/25 px-2 py-0.5 rounded-md tracking-wider shrink-0">
                  {ribbon.badge}
                </span>
              )}
              <Link href={ribbon.link || "/shop"} className="hover:underline truncate flex items-center gap-1">
                <span>{ribbon.text}</span>
                <span className="opacity-90 font-bold ml-1 hidden sm:inline">Shop Now →</span>
              </Link>
            </div>

            <button
              onClick={() => setDismissedIds((prev) => ({ ...prev, [ribbon.id]: true }))}
              className="text-white/80 hover:text-white p-0.5 rounded-md hover:bg-black/10 transition-colors shrink-0"
              aria-label={`Close announcement ${idx + 1}`}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

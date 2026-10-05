"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Bell, Tag, Sparkles, Package, ExternalLink, X, Check } from "lucide-react"

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  link?: string
  badge?: string
  createdAt?: string
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "🔥 Special 20% Discount Live!",
    message: "Use code PROTEIN20 at checkout for flat 20% off all Whey & Plant proteins.",
    type: "OFFER",
    badge: "20% OFF",
    link: "/deals",
  },
  {
    id: "notif-2",
    title: "🚀 New Product Drop: ISO Gold Belgian Chocolate",
    message: "100% Whey Isolate with 27g protein per scoop and zero added sugars.",
    type: "PRODUCT",
    badge: "NEW ARRIVAL",
    link: "/shop?category=whey-protein",
  },
  {
    id: "notif-3",
    title: "📦 Instant WhatsApp Order Tracking",
    message: "Opt-in on checkout or login to receive live dispatch & courier tracking updates.",
    type: "UPDATE",
    badge: "WHATSAPP",
    link: "/account/orders",
  },
]

export default function NotificationsDropdown({ showLabel = false, label = "Updates" }: { showLabel?: boolean; label?: string } = {}) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS)
  const [unreadCount, setUnreadCount] = useState(2)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications && data.notifications.length > 0) {
          setNotifications(data.notifications)
          setUnreadCount(data.notifications.length)
        }
      })
      .catch(() => {})
  }, [])

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOpen = () => {
    setOpen(!open)
    if (!open) {
      setUnreadCount(0)
    }
  }

  const copyPromo = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className={showLabel ? "w-full relative" : "relative"} ref={menuRef}>
      <button
        onClick={handleOpen}
        className={
          showLabel
            ? "flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl w-full text-left"
            : "btn-ghost p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white relative"
        }
        aria-label="Update System"
        title="Update System"
      >
        <span className="flex items-center gap-2">
          <Bell size={showLabel ? 14 : 19} />
          {showLabel && <span>{label}</span>}
        </span>
        {unreadCount > 0 && (
          <span
            className={
              showLabel
                ? "w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                : "absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-scale-in"
            }
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4 z-50 animate-scale-in">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
                <Sparkles size={14} />
              </div>
              <h3 className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
                Update System
              </h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            >
              <X size={14} />
            </button>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-80 overflow-y-auto">
            {notifications.map((item) => (
              <div key={item.id} className="py-3 first:pt-2 last:pb-1 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 leading-tight">
                    {item.title}
                  </span>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 whitespace-nowrap">
                      {item.badge}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {item.message}
                </p>

                <div className="flex items-center justify-between pt-1">
                  {item.message.includes("PROTEIN20") ? (
                    <button
                      onClick={() => copyPromo("PROTEIN20")}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2 py-1 rounded-md hover:bg-brand-100 transition-colors"
                    >
                      {copiedCode === "PROTEIN20" ? (
                        <>
                          <Check size={11} className="text-emerald-500" /> Copied!
                        </>
                      ) : (
                        <>
                          <Tag size={11} /> Copy Code: PROTEIN20
                        </>
                      )}
                    </button>
                  ) : null}

                  {item.link && (
                    <Link
                      href={item.link}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-red-500 ml-auto transition-colors"
                    >
                      View <ExternalLink size={10} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <Link
              href="/deals"
              onClick={() => setOpen(false)}
              className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Browse All Active Deals & Coupons →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

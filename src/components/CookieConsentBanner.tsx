"use client"
import { useState, useEffect } from "react"
import { Cookie, X, Settings } from "lucide-react"

export default function CookieConsentBanner() {
  const [show, setShow] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false })

  useEffect(() => {
    try {
      const consent = localStorage.getItem("nutratein_cookie_consent")
      if (!consent) {
        setTimeout(() => setShow(true), 1500)
      }
    } catch {}
  }, [])

  const accept = (all: boolean) => {
    const consent = {
      essential: true,
      analytics: all ? true : prefs.analytics,
      marketing: all ? true : prefs.marketing,
      timestamp: new Date().toISOString(),
    }
    try { localStorage.setItem("nutratein_cookie_consent", JSON.stringify(consent)) } catch {}
    setShow(false)
  }

  const decline = () => {
    const consent = { essential: true, analytics: false, marketing: false, timestamp: new Date().toISOString() }
    try { localStorage.setItem("nutratein_cookie_consent", JSON.stringify(consent)) } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-[90] animate-slide-up">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
              <Cookie size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">Cookie Preferences</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                We use cookies to enhance your shopping experience. See{" "}
                <a href="/cookie-policy" className="underline text-brand-600 font-semibold hover:text-brand-500">
                  Cookie Policy
                </a>.
              </p>
            </div>
          </div>
          <button
            onClick={decline}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg shrink-0 transition-colors"
            aria-label="Close cookie banner"
          >
            <X size={15} />
          </button>
        </div>

        {showDetails && (
          <div className="space-y-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/50 dark:border-zinc-700/50">
              <div>
                <p className="font-bold text-[11px] text-zinc-800 dark:text-zinc-200">Essential Cookies</p>
                <p className="text-[10px] text-zinc-400">Required for checkout & login.</p>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                Always On
              </span>
            </div>
            {[{ key: "analytics", label: "Analytics", desc: "Understand site traffic" },
              { key: "marketing", label: "Marketing", desc: "Personalized offers" }].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-1">
                <div>
                  <p className="font-bold text-[11px] text-zinc-800 dark:text-zinc-200">{label}</p>
                  <p className="text-[10px] text-zinc-400">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefs(p => ({ ...p, [key]: !(p as any)[key] }))}
                  className={`w-7 h-4 rounded-full transition-colors relative ${(prefs as any)[key] ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                >
                  <div className={`w-3 h-3 bg-white rounded-full shadow absolute top-0.5 transition-transform ${(prefs as any)[key] ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => accept(true)}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md text-center"
          >
            Accept All
          </button>
          <button
            onClick={decline}
            className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs py-2 px-3 rounded-xl transition-colors text-center"
          >
            Decline
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-colors"
            title="Manage Preferences"
            aria-label="Manage Preferences"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

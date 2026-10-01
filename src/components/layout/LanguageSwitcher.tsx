"use client"

import { useState, useEffect, useRef } from "react"
import { Globe, Check } from "lucide-react"
import { useLanguageStore, SupportedLanguage } from "@/store/language"

const LANGUAGES: { code: SupportedLanguage; label: string; sub: string }[] = [
  { code: "en", label: "English", sub: "EN" },
  { code: "hi", label: "हिन्दी", sub: "HI" },
  { code: "mr", label: "मराठी", sub: "MR" },
  { code: "ta", label: "தமிழ்", sub: "TA" },
]

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = language
    }
  }, [language, mounted])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 text-xs font-bold">
        EN
      </div>
    )
  }

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost px-2 py-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white flex items-center gap-1.5 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
        aria-label="Switch Language"
        title="Change Language (English / தமிழ்)"
      >
        <Globe size={15} className="text-zinc-400 group-hover:text-brand-600" />
        <span className="uppercase text-[11px]">{current.sub}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-50 animate-scale-in">
          <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Language / மொழி
          </div>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code)
                setOpen(false)
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                language === l.code
                  ? "bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span>{l.label}</span>
              {language === l.code && <Check size={13} className="text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { useLanguageStore, SupportedLanguage } from "@/store/language"

export function useTranslation() {
  const store = useLanguageStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const t = (keyPath: string, replacements?: Record<string, string | number>) => {
    // To prevent hydration errors, always return English during SSR and initial hydration.
    // Once mounted, return the user's selected language.
    if (!mounted) {
      return store.t(keyPath, replacements, "en")
    }
    return store.t(keyPath, replacements)
  }

  return {
    t,
    language: mounted ? store.language : "en",
    setLanguage: store.setLanguage,
    mounted
  }
}

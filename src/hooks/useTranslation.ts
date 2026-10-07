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
    return store.t(keyPath, replacements)
  }

  return {
    t,
    language: store.language,
    setLanguage: store.setLanguage,
    mounted
  }
}

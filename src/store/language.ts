import { create } from "zustand"
import { persist } from "zustand/middleware"
import en from "@/locales/en.json"
import ta from "@/locales/ta.json"
import hi from "@/locales/hi.json"
import mr from "@/locales/mr.json"

export type SupportedLanguage = "en" | "hi" | "mr" | "ta"

const translations: Record<SupportedLanguage, any> = {
  en,
  hi,
  mr,
  ta,
}

interface LanguageStore {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  t: (keyPath: string, replacements?: Record<string, string | number>, overrideLang?: SupportedLanguage) => string
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: "en",

      setLanguage: (lang) => {
        set({ language: lang })
      },

      t: (keyPath, replacements, overrideLang) => {
        const lang = overrideLang || get().language || "en"
        const dict = translations[lang] || translations.en

        const keys = keyPath.split(".")
        let result: any = dict

        for (const k of keys) {
          if (result && typeof result === "object" && k in result) {
            result = result[k]
          } else {
            // Fallback to English
            let fallback: any = translations.en
            for (const fk of keys) {
              if (fallback && typeof fallback === "object" && fk in fallback) {
                fallback = fallback[fk]
              } else {
                fallback = keyPath
                break
              }
            }
            result = fallback
            break
          }
        }

        if (typeof result !== "string") {
          return keyPath
        }

        if (replacements) {
          let str = result
          for (const [rKey, rVal] of Object.entries(replacements)) {
            str = str.replace(new RegExp(`\\{${rKey}\\}`, "g"), String(rVal))
          }
          return str
        }

        return result
      },
    }),
    {
      name: "nutratein-language",
    }
  )
)

import { create } from "zustand"
import { persist } from "zustand/middleware"
import en from "@/locales/en.json"

export type SupportedLanguage = "en" | "hi" | "mr" | "ta"

function getInitialLanguage(): SupportedLanguage {
  if (typeof window !== "undefined") {
    try {
      // Clear legacy language cookies to ensure English only
      document.cookie = "nutratein-language=en;path=/;max-age=31536000"
      localStorage.removeItem("nutratein-language")
    } catch {}
  }
  return "en"
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

      setLanguage: () => {
        // Enforce English only per user requirement
        set({ language: "en" })
      },

      t: (keyPath, replacements) => {
        const dict = en as any
        const keys = keyPath.split(".")
        let result: any = dict

        for (const k of keys) {
          if (result && typeof result === "object" && k in result) {
            result = result[k]
          } else {
            return keyPath
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

"use client"
import { useTranslation } from "@/hooks/useTranslation"
import { SupportedLanguage } from "@/store/language"

interface TranslateProps {
  tKey: string
  replacements?: Record<string, string | number>
}

export default function Translate({ tKey, replacements }: TranslateProps) {
  const { t } = useTranslation()
  return <>{t(tKey, replacements)}</>
}

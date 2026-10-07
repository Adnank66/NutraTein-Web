"use client"
import { useState, useEffect } from "react"
import { Type, Save, RefreshCw, ChevronDown, ChevronRight, Globe, Search } from "lucide-react"
import { toast } from "sonner"

const LANG_LABELS: Record<string, string> = {
  en: "🇬🇧 English",
  hi: "🇮🇳 Hindi",
  mr: "🇮🇳 Marathi",
  ta: "🇮🇳 Tamil",
}

function flattenObject(obj: any, prefix = ""): Record<string, string> {
  return Object.keys(obj).reduce((acc: Record<string, string>, key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], fullKey))
    } else {
      acc[fullKey] = String(obj[key] ?? "")
    }
    return acc
  }, {})
}

function groupByPrefix(flat: Record<string, string>): Record<string, Record<string, string>> {
  const groups: Record<string, Record<string, string>> = {}
  for (const [key, val] of Object.entries(flat)) {
    const prefix = key.split(".")[0]
    if (!groups[prefix]) groups[prefix] = {}
    groups[prefix][key] = val
  }
  return groups
}

export default function TextEditorPage() {
  const [locales, setLocales] = useState<Record<string, any>>({})
  const [activeLang, setActiveLang] = useState("en")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ nav: true, home: true })
  const [search, setSearch] = useState("")
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    fetch("/api/admin/text-content")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setLocales(d.locales)
          // Init edits with current values
          const initial: Record<string, Record<string, string>> = {}
          for (const lang of ["en", "hi", "mr", "ta"]) {
            initial[lang] = flattenObject(d.locales[lang] || {})
          }
          setEdits(initial)
        }
      })
      .catch(() => toast.error("Failed to load text content"))
      .finally(() => setLoading(false))
  }, [])

  const handleEdit = (lang: string, key: string, value: string) => {
    setEdits(prev => ({
      ...prev,
      [lang]: { ...(prev[lang] || {}), [key]: value }
    }))
  }

  const handleSaveKey = async (lang: string, key: string) => {
    const saveKey = `${lang}:${key}`
    setSaving(prev => ({ ...prev, [saveKey]: true }))
    try {
      const res = await fetch("/api/admin/text-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, key, value: edits[lang]?.[key] ?? "" }),
      })
      if (res.ok) {
        toast.success(`Saved "${key}" in ${LANG_LABELS[lang]}`)
      } else {
        toast.error("Failed to save")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setSaving(prev => ({ ...prev, [saveKey]: false }))
    }
  }

  const handleSaveSection = async (lang: string, keys: string[]) => {
    setSaving(prev => ({ ...prev, [`section-${lang}`]: true }))
    let savedCount = 0
    for (const key of keys) {
      try {
        await fetch("/api/admin/text-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang, key, value: edits[lang]?.[key] ?? "" }),
        })
        savedCount++
      } catch {}
    }
    toast.success(`Saved ${savedCount} translations in ${LANG_LABELS[lang]}`)
    setSaving(prev => ({ ...prev, [`section-${lang}`]: false }))
  }

  const currentFlat = edits[activeLang] || {}
  const groups = groupByPrefix(currentFlat)
  const enFlat = edits["en"] || {}

  const filteredGroups: Record<string, Record<string, string>> = {}
  for (const [section, keys] of Object.entries(groups)) {
    const filtered: Record<string, string> = {}
    for (const [k, v] of Object.entries(keys)) {
      const enVal = enFlat[k] || k
      if (!search || k.includes(search.toLowerCase()) || enVal.toLowerCase().includes(search.toLowerCase()) || v.toLowerCase().includes(search.toLowerCase())) {
        filtered[k] = v
      }
    }
    if (Object.keys(filtered).length > 0) filteredGroups[section] = filtered
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Type size={24} className="text-brand-600" />
            Website Text Editor (CMS)
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Edit all website visible text in all 4 languages. Changes apply instantly on save.
          </p>
        </div>
      </div>

      {/* Language Tabs */}
      <div className="flex gap-2 flex-wrap bg-zinc-100 dark:bg-zinc-800 p-1 rounded-2xl w-fit">
        {["en", "hi", "mr", "ta"].map(lang => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeLang === lang
                ? "bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {LANG_LABELS[lang]}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by key or text..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-zinc-400">Loading text content...</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredGroups).map(([section, keys]) => (
            <div key={section} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
              {/* Section Header */}
              <button
                onClick={() => setOpenSections(p => ({ ...p, [section]: !p[section] }))}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-brand-500" />
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 capitalize">{section}</span>
                  <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-mono">
                    {Object.keys(keys).length} keys
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); handleSaveSection(activeLang, Object.keys(keys)) }}
                    disabled={saving[`section-${activeLang}`]}
                    className="text-[10px] bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50"
                  >
                    {saving[`section-${activeLang}`] ? <RefreshCw size={10} className="animate-spin" /> : <Save size={10} />}
                    Save All
                  </button>
                  {openSections[section] ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronRight size={16} className="text-zinc-400" />}
                </div>
              </button>

              {openSections[section] !== false && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {Object.entries(keys).map(([key, val]) => {
                    const enVal = enFlat[key]
                    const saveKey = `${activeLang}:${key}`
                    return (
                      <div key={key} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="sm:w-1/3 shrink-0">
                          <p className="text-[10px] font-mono text-zinc-400 truncate">{key}</p>
                          {activeLang !== "en" && enVal && (
                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">English: {enVal}</p>
                          )}
                        </div>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={edits[activeLang]?.[key] ?? val}
                            onChange={e => handleEdit(activeLang, key, e.target.value)}
                            className="flex-1 text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-brand-500"
                          />
                          <button
                            onClick={() => handleSaveKey(activeLang, key)}
                            disabled={saving[saveKey]}
                            className="shrink-0 p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/60 disabled:opacity-50 transition-colors"
                          >
                            {saving[saveKey] ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

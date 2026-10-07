"use client"
import { useState, useEffect } from "react"
import { FileText, Save, Edit2 } from "lucide-react"
import { toast } from "sonner"

const LEGAL_SLUGS = [
  { slug: "terms", label: "Terms & Conditions" },
  { slug: "privacy", label: "Privacy Policy" },
  { slug: "refund-policy", label: "Refund Policy" },
  { slug: "shipping-policy", label: "Shipping Policy" },
  { slug: "cookie-policy", label: "Cookie Policy" },
]

export default function AdminLegalPage() {
  const [selected, setSelected] = useState("terms")
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadPage = async (slug: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/legal?slug=${slug}`)
      const d = await res.json()
      setContent(d.page?.content || "")
      setTitle(d.page?.title || "")
    } finally { setLoading(false) }
  }

  useEffect(() => { loadPage(selected) }, [selected])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selected, title, content }),
      })
      if (res.ok) toast.success("Legal page saved!")
      else toast.error("Failed to save")
    } finally { setSaving(false) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
          <FileText className="text-blue-600 dark:text-blue-400" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Legal Pages CMS</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Edit legal policy content. Have these reviewed by a legal professional.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEGAL_SLUGS.map(({ slug, label }) => (
          <button key={slug} onClick={() => setSelected(slug)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              selected === slug
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}>{label}</button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-1">Page Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-1">
            Content (Markdown supported: # H1, ## H2, paragraphs)
          </label>
          <textarea rows={20} value={content} onChange={e => setContent(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-y" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm disabled:opacity-50">
            <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
          </button>
          <a href={`/${selected}`} target="_blank"
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline">Preview page ↗</a>
        </div>
      </div>
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { FileText } from "lucide-react"

export default function LegalPageContent({ slug }: { slug: string }) {
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/legal?slug=${slug}`)
      .then(r => r.json())
      .then(d => setPage(d.page || null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="py-20 text-center text-zinc-400">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <FileText size={24} className="text-brand-600" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{page?.title || slug}</h1>
      </div>
      <div className="prose dark:prose-invert max-w-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-8">
        {page?.content ? (
          <div className="space-y-4 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
            {page.content.split('\n\n').map((block: string, i: number) => {
              if (block.startsWith('# ')) return <h1 key={i} className="text-2xl font-black text-zinc-900 dark:text-white">{block.slice(2)}</h1>
              if (block.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-zinc-900 dark:text-white mt-6">{block.slice(3)}</h2>
              return <p key={i}>{block}</p>
            })}
          </div>
        ) : (
          <p className="text-zinc-400">Content not available. Please check back later.</p>
        )}
        {page?.updatedAt && (
          <p className="text-[10px] text-zinc-400 mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            Last updated: {new Date(page.updatedAt).toLocaleDateString('en-IN')}
          </p>
        )}
      </div>
    </div>
  )
}

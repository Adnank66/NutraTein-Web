"use client"
import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Save, X, HelpCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface FAQ {
  id: string
  question: string
  answer: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editData, setEditData] = useState({ question: "", answer: "", sortOrder: 0, isActive: true })
  const [newData, setNewData] = useState({ question: "", answer: "", sortOrder: 0, isActive: true })
  const [saving, setSaving] = useState(false)

  const fetchFAQs = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/faq")
      const data = await res.json()
      setFaqs(data.faqs || [])
    } catch {
      toast.error("Failed to load FAQs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFAQs() }, [])

  const startEdit = (faq: FAQ) => {
    setEditingId(faq.id)
    setEditData({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder, isActive: faq.isActive })
  }

  const saveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/faq", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editData }),
      })
      if (res.ok) {
        toast.success("FAQ updated")
        setEditingId(null)
        fetchFAQs()
      } else toast.error("Failed to update FAQ")
    } finally {
      setSaving(false)
    }
  }

  const deleteFAQ = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return
    const res = await fetch("/api/admin/faq", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success("FAQ deleted"); fetchFAQs() }
    else toast.error("Failed to delete")
  }

  const toggleActive = async (faq: FAQ) => {
    await fetch("/api/admin/faq", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: faq.id, isActive: !faq.isActive }),
    })
    fetchFAQs()
  }

  const addFAQ = async () => {
    if (!newData.question.trim() || !newData.answer.trim()) {
      toast.error("Question and answer are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      })
      if (res.ok) {
        toast.success("FAQ added")
        setShowAdd(false)
        setNewData({ question: "", answer: "", sortOrder: 0, isActive: true })
        fetchFAQs()
      } else toast.error("Failed to add FAQ")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
            <HelpCircle className="text-purple-600 dark:text-purple-400" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">FAQ Manager</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage questions & answers shown on the storefront</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (!confirm("Restore all 7 default homepage FAQs to database?")) return
              try {
                const res = await fetch("/api/admin/faq", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "seed_defaults" }),
                })
                if (res.ok) {
                  toast.success("Homepage FAQs synced to database!")
                  fetchFAQs()
                } else {
                  toast.error("Failed to sync FAQs")
                }
              } catch {
                toast.error("Error connecting to FAQ API")
              }
            }}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700"
            title="Seed/Sync the 7 default homepage FAQs into MongoDB"
          >
            <HelpCircle size={14} className="text-purple-500" /> Sync Homepage FAQs
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={14} /> Add FAQ
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-100 mb-4">New FAQ</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Question *</label>
              <input
                value={newData.question}
                onChange={e => setNewData(p => ({ ...p, question: e.target.value }))}
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="What is your question?"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Answer *</label>
              <textarea
                value={newData.answer}
                onChange={e => setNewData(p => ({ ...p, answer: e.target.value }))}
                rows={4}
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Write a detailed answer..."
              />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">Sort Order</label>
                <input
                  type="number"
                  value={newData.sortOrder}
                  onChange={e => setNewData(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                  className="w-24 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="newActive"
                  checked={newData.isActive}
                  onChange={e => setNewData(p => ({ ...p, isActive: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="newActive" className="text-xs text-zinc-600 dark:text-zinc-400">Active (visible on site)</label>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addFAQ}
              disabled={saving}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-50"
            >
              <Save size={13} /> {saving ? "Saving..." : "Add FAQ"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-4 py-2 rounded-xl"
            >
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-zinc-400 dark:text-zinc-500">Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No FAQs yet. Add your first FAQ above.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">The storefront will show default FAQs until you add custom ones.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={faq.id}
              className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 transition-all ${
                !faq.isActive
                  ? "opacity-60 border-zinc-200 dark:border-zinc-800"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {editingId === faq.id ? (
                <div className="space-y-3">
                  <input
                    value={editData.question}
                    onChange={e => setEditData(p => ({ ...p, question: e.target.value }))}
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                  <textarea
                    value={editData.answer}
                    onChange={e => setEditData(p => ({ ...p, answer: e.target.value }))}
                    rows={4}
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
                  />
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="number"
                      value={editData.sortOrder}
                      onChange={e => setEditData(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                      className="w-20 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      placeholder="Order"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={editData.isActive}
                        onChange={e => setEditData(p => ({ ...p, isActive: e.target.checked }))}
                      />
                      Active
                    </label>
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex items-center gap-1 bg-brand-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                      >
                        <Save size={12} /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs px-3 py-1.5 rounded-lg"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-0.5 mt-0.5 shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{faq.question}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleActive(faq)}
                        title={faq.isActive ? "Hide from site" : "Show on site"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          faq.isActive
                            ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                            : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800"
                        }`}
                      >
                        {faq.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => startEdit(faq)}
                        className="p-1.5 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteFAQ(faq.id)}
                        className="p-1.5 rounded-lg text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {!faq.isActive && (
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">Hidden</span>
                    )}
                    <span className="text-[10px] text-zinc-400">Sort: {faq.sortOrder}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

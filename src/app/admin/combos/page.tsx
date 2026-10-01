"use client"
import { useState, useEffect } from "react"
import { Save, Layers } from "lucide-react"
import { toast } from "sonner"

export default function AdminCombosPage() {
  const [jsonText, setJsonText] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/combos")
      .then(r => r.json())
      .then(data => {
        setJsonText(JSON.stringify(data.combos, null, 2))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) throw new Error("Combos must be an array")
      
      setSaving(true)
      const res = await fetch("/api/admin/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ combos: parsed })
      })
      
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Combos successfully updated!")
    } catch (err: any) {
      toast.error("Invalid JSON format: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center">
            <Layers className="text-brand-600 dark:text-brand-400" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Combos / Stack Builder</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage the product combos shown on the storefront</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <Save size={14} /> {saving ? "Saving..." : "Save Combos"}
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 shadow-sm">
        <p className="text-xs text-zinc-500 mb-4">
          Edit the JSON structure below to update the combo steps and products. 
          Make sure the structure remains an array of steps, where each step has an <code>id</code>, <code>label</code>, and <code>options</code> array.
        </p>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center text-zinc-400">Loading...</div>
        ) : (
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full h-[600px] font-mono text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-800 dark:text-zinc-200"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
}

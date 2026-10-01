"use client"

import { useState, useEffect } from "react"
import { Globe, Plus, Trash, Edit, Check, X } from "lucide-react"
import { toast } from "sonner"

export default function SocialLinksPage() {
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form states
  const [platform, setPlatform] = useState("")
  const [url, setUrl] = useState("")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const res = await fetch("/api/admin/social")
      const data = await res.json()
      if (data.links) {
        setLinks(data.links)
      }
    } catch (e) {
      toast.error("Failed to load links")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPlatform("")
    setUrl("")
    setIsActive(true)
    setIsAdding(false)
    setEditingId(null)
  }

  const startEdit = (link: any) => {
    setPlatform(link.platform)
    setUrl(link.url)
    setIsActive(link.isActive)
    setEditingId(link.id)
    setIsAdding(false)
  }

  const handleSave = async () => {
    if (!platform || !url) {
      toast.error("Platform and URL are required")
      return
    }
    
    try {
      const method = editingId ? "PATCH" : "POST"
      const body = editingId
        ? { id: editingId, platform, url, isActive }
        : { platform, url, isActive }

      const res = await fetch("/api/admin/social", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)
      
      toast.success(editingId ? "Link updated" : "Link added")
      fetchLinks()
      resetForm()
    } catch (e: any) {
      toast.error(e.message || "Failed to save link")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return
    try {
      const res = await fetch("/api/admin/social", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      toast.success("Link deleted")
      fetchLinks()
    } catch (e: any) {
      toast.error(e.message || "Failed to delete link")
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="text-brand-500" />
            Social Media Links
          </h1>
          <p className="text-zinc-400 mt-1">Manage your brand's social media presence</p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add Link
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Social Link" : "Add New Social Link"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Platform Name</label>
              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="e.g. Instagram"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center gap-2 mt-2 md:col-span-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 bg-zinc-950 border-zinc-800 rounded text-brand-500 focus:ring-brand-500 focus:ring-offset-zinc-900"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-zinc-400">
                Active (Visible on storefront)
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors"
            >
              <Check size={18} />
              Save
            </button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading links...</div>
        ) : links.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No social links found. Add one to get started.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/50 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Platform</th>
                <th className="px-6 py-4 font-medium">URL</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{link.platform}</td>
                  <td className="px-6 py-4 text-zinc-400">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-400">
                      {link.url}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      link.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {link.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(link)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

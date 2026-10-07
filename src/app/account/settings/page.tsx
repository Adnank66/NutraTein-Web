"use client"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Camera, Loader2, Save } from "lucide-react"

export default function SettingsPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [image, setImage] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.user) {
          setName(data.user.name || "")
          setPhone(data.user.phone || "")
          setEmail(data.user.email || "")
          setImage(data.user.image || "")
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to upload image")
      setImage(data.url)
      
      // Auto-save the profile picture update
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, image: data.url })
      })
      toast.success("Profile picture updated!")
    } catch (err: any) {
      toast.error(err.message || "Could not upload image")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, image })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update profile")
      toast.success("Profile details updated successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-6 max-w-xl flex items-center justify-center py-20 dark:bg-zinc-900 dark:border-zinc-800">
        <Loader2 className="animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <div className="card p-6 space-y-6 max-w-xl dark:bg-zinc-900 dark:border-zinc-800">
      <div>
        <h1 className="text-xl font-bold text-dark-900 dark:text-white">Account Settings</h1>
        <p className="text-xs text-dark-500 dark:text-zinc-400 mt-0.5">Update your personal details and profile picture.</p>
      </div>

      <div className="flex justify-center pb-4 border-b border-dark-100 dark:border-zinc-800">
        <div 
          className="relative w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 border-4 border-white dark:border-zinc-950 shadow-md flex items-center justify-center overflow-hidden cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          {image ? (
            <img src={image} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-zinc-400 dark:text-zinc-600">
              {name ? name.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : "U")}
            </span>
          )}
          
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 className="animate-spin text-white" size={24} />
            ) : (
              <Camera className="text-white" size={24} />
            )}
          </div>
          
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="label dark:text-zinc-400">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
            required
          />
        </div>

        <div>
          <label className="label dark:text-zinc-400">Email Address (Read-only)</label>
          <input
            type="email"
            value={email}
            disabled
            className="input text-xs bg-dark-50 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="label dark:text-zinc-400">Contact Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
            maxLength={10}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2">
          {saving ? (
            <><Loader2 size={14} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={14} /> Save Changes</>
          )}
        </button>
      </form>
    </div>
  )
}
"use client"
import { useState } from "react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [name, setName] = useState("John Doe")
  const [phone, setPhone] = useState("9876543210")
  const [loading, setLoading] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success("Profile details updated successfully!")
    }, 500)
  }

  return (
    <div className="card p-6 space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-dark-900">Account Settings</h1>
        <p className="text-xs text-dark-500 mt-0.5">Update personal details and notification preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input text-xs"
            required
          />
        </div>

        <div>
          <label className="label">Contact Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input text-xs"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary text-xs py-2.5 px-6">
          {loading ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  )
}
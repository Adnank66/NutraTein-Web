"use client"

import { useState } from "react"
import { RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function AdminClearDataButton({
  scope = "all",
  label = "Clear All Store Data",
  className = "",
}: {
  scope?: "orders" | "customers" | "all"
  label?: string
  className?: string
}) {
  const [clearing, setClearing] = useState(false)

  const handleClear = async (clearMode: "all" | "one" = "all") => {
    const msg =
      clearMode === "one"
        ? `Clear one recent ${scope === "all" ? "record" : scope} from admin view? (MongoDB data stays 100% safe)`
        : scope === "orders"
        ? "Clear orders from admin panel view? (Note: MongoDB database purchases remain 100% safe)"
        : scope === "customers"
        ? "Clear customers from admin panel view? (Note: MongoDB database customer records remain 100% safe)"
        : "Clear all store data from the admin panel view? (Note: Your MongoDB database purchases and customer records will remain 100% safe and intact)"

    if (!confirm(msg)) return

    setClearing(true)
    try {
      const res = await fetch("/api/admin/clear-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, mode: clearMode }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || "Admin panel view updated successfully!")
        setTimeout(() => {
          window.location.reload()
        }, 600)
      } else {
        toast.error(data.error || "Failed to clear data")
        setClearing(false)
      }
    } catch (err: any) {
      toast.error(err.message || "Error clearing data")
      setClearing(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => handleClear("one")}
        disabled={clearing}
        className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
        title="Clear only one record from view"
      >
        <Trash2 size={12} />
        <span>Clear One</span>
      </button>

      <button
        type="button"
        onClick={() => handleClear("all")}
        disabled={clearing}
        className={
          className ||
          "text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        }
        title="Clear store data from admin view (MongoDB database records safe)"
      >
        <Trash2 size={13} className={clearing ? "animate-spin" : ""} />
        <span>{clearing ? "Clearing..." : label}</span>
      </button>
    </div>
  )
}

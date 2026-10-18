"use client"

import { useState, useEffect } from "react"
import {
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Package,
  ShieldCheck,
  Save,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"

export default function EmailSettingsManager() {
  const [primaryEmail, setPrimaryEmail] = useState("nutratein@gmail.com")
  const [secondaryEmail, setSecondaryEmail] = useState("adnankazi275@gmail.com")
  const [lowStockThreshold, setLowStockThreshold] = useState(25)
  const [notifyNewOrders, setNotifyNewOrders] = useState(true)
  const [notifyLowStock, setNotifyLowStock] = useState(true)
  const [notifyReturns, setNotifyReturns] = useState(true)
  const [notifyContactForm, setNotifyContactForm] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/email-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          if (data.settings.primaryEmail) setPrimaryEmail(data.settings.primaryEmail)
          if (data.settings.secondaryEmail) setSecondaryEmail(data.settings.secondaryEmail)
          if (typeof data.settings.lowStockThreshold === "number") setLowStockThreshold(data.settings.lowStockThreshold)
          if (typeof data.settings.notifyNewOrders === "boolean") setNotifyNewOrders(data.settings.notifyNewOrders)
          if (typeof data.settings.notifyLowStock === "boolean") setNotifyLowStock(data.settings.notifyLowStock)
          if (typeof data.settings.notifyReturns === "boolean") setNotifyReturns(data.settings.notifyReturns)
          if (typeof data.settings.notifyContactForm === "boolean") setNotifyContactForm(data.settings.notifyContactForm)
        }
      })
      .catch((err) => console.warn("Failed to load email settings:", err))
  }, [])

  const handleSendTest = async () => {
    setTesting(true)
    try {
      const res = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_test", targetEmail: primaryEmail }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Live test email successfully sent to ${primaryEmail}!`)
      } else {
        toast.error("Failed to send test email: " + data.error)
      }
    } catch {
      toast.error("Network error while triggering test email")
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryEmail,
          secondaryEmail,
          lowStockThreshold,
          notifyNewOrders,
          notifyLowStock,
          notifyReturns,
          notifyContactForm,
        }),
      })
      if (res.ok) {
        toast.success("Notification preferences saved successfully!")
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Mail size={24} className="text-brand-600" />
            Email Alerts & Notification Recipients
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure destination mailboxes for real-time order alerts, inventory depletion warnings, and customer inquiries.
          </p>
        </div>

        <button
          onClick={handleSendTest}
          disabled={testing}
          className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-2 font-bold shrink-0"
        >
          <Send size={14} className={testing ? "animate-pulse text-brand-600" : ""} />
          {testing ? "Dispatching Test..." : "Send Test Alert Email"}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Recipient Addresses Card */}
        <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            Primary Store Owner Recipient
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Super Admin Alert Gmail
              </label>
              <input
                type="email"
                value={primaryEmail}
                onChange={(e) => setPrimaryEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-mono"
              />
              <p className="text-[10px] text-emerald-600 mt-1">
                ✓ Receives instant notification on every new customer purchase
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Secondary / CC Email Address
              </label>
              <input
                type="email"
                value={secondaryEmail}
                onChange={(e) => setSecondaryEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-mono"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Backup notification recipient</p>
            </div>
          </div>
        </div>

        {/* Low Stock Depletion Warning Settings */}
        <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <Package size={16} className="text-brand-500" />
              Inventory & Low-Stock Trigger (Depletion Warning)
            </h3>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-800">
              Threshold: {lowStockThreshold} Units
            </span>
          </div>

          <div className="max-w-xl space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Manual Alert Unit Number (Alert triggers when inventory drops ≤ this unit number)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-40">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={lowStockThreshold}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      if (!isNaN(val) && val >= 1) setLowStockThreshold(val)
                    }}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold font-mono text-zinc-900 dark:text-white text-center focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-semibold pointer-events-none">
                    units
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5">
                  {[10, 15, 20, 25, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setLowStockThreshold(preset)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        lowStockThreshold === preset
                          ? "bg-brand-600 text-white shadow-sm"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Range Slider for visual fine-tuning */}
            <div className="pt-1">
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={Math.min(100, Math.max(5, lowStockThreshold))}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                🔔 <strong>Automated Depletion Alert:</strong> An instant warning email is automatically dispatched to <strong>{primaryEmail}</strong> whenever any supplement flavor, size, or product inventory drops to <strong>{lowStockThreshold} units or fewer</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Notification Event Toggles */}
        <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <Bell size={16} className="text-purple-500" />
            Alert Subscriptions
          </h3>

          <div className="space-y-3">
            {[
              {
                id: "orders",
                title: "Instant New Order Alerts",
                desc: "Send full order receipt with customer address & phone whenever an order is submitted.",
                checked: notifyNewOrders,
                setter: setNotifyNewOrders,
              },
              {
                id: "stock",
                title: "Low Stock Depletion Warnings",
                desc: `Notify immediately when any product inventory reaches ${lowStockThreshold} units.`,
                checked: notifyLowStock,
                setter: setNotifyLowStock,
              },
              {
                id: "returns",
                title: "Return & Cancellation Requests",
                desc: "Alert when a buyer requests an exchange or damaged parcel refund.",
                checked: notifyReturns,
                setter: setNotifyReturns,
              },
              {
                id: "contact",
                title: "Customer Contact Inquiries",
                desc: "Forward direct buyer support messages from the Contact Us form.",
                checked: notifyContactForm,
                setter: setNotifyContactForm,
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60"
              >
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">{item.title}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => item.setter(!item.checked)}
                  className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                    item.checked ? "bg-brand-600" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      item.checked ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
          >
            <Save size={15} /> {saving ? "Saving..." : "Save Notification Preferences"}
          </button>
        </div>
      </form>
    </div>
  )
}

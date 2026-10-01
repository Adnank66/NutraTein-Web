"use client"

import { useState } from "react"
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
  const [primaryEmail, setPrimaryEmail] = useState("adnankazi275@gmail.com")
  const [secondaryEmail, setSecondaryEmail] = useState("admin@proteinx.in")
  const [lowStockThreshold, setLowStockThreshold] = useState(25)
  const [notifyNewOrders, setNotifyNewOrders] = useState(true)
  const [notifyLowStock, setNotifyLowStock] = useState(true)
  const [notifyReturns, setNotifyReturns] = useState(true)
  const [notifyContactForm, setNotifyContactForm] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

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
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <Package size={16} className="text-brand-500" />
            Inventory & Low-Stock Trigger
          </h3>

          <div className="max-w-md">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-zinc-700 dark:text-zinc-300">Trigger Threshold</span>
              <span className="font-mono font-bold text-brand-600">{lowStockThreshold} Units Left</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
            />
            <p className="text-[11px] text-zinc-400 mt-1.5">
              An automated restocking email alert will be dispatched to <strong>{primaryEmail}</strong> whenever any supplement flavor or weight variant drops to or below {lowStockThreshold} units.
            </p>
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

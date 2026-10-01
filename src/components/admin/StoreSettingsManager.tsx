"use client"

import { useState, useEffect } from "react"
import {
  Settings,
  Store,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  QrCode,
  DollarSign,
  Save,
  CheckCircle2,
  FileCheck,
  Megaphone,
} from "lucide-react"
import { toast } from "sonner"

export default function StoreSettingsManager() {
  const [storeName, setStoreName] = useState("PROTEINX Nutrition")
  const [tagline, setTagline] = useState("India's Most Trusted Pure Fitness Supplements")
  const [supportPhone, setSupportPhone] = useState("+91 9321598094")
  const [supportEmail, setSupportEmail] = useState("adnankazi275@gmail.com")
  const [upiId, setUpiId] = useState("9321598094@ybl")
  const [payeeName, setPayeeName] = useState("ADNAN KAZI")
  const [enableCod, setEnableCod] = useState(true)
  const [enableUpi, setEnableUpi] = useState(true)
  const [gstin, setGstin] = useState("27AABCP1234F1ZX")
  const [fssaiLicense, setFssaiLicense] = useState("10020021000543")
  const [warehouseAddress, setWarehouseAddress] = useState(
    "Plot No. 42, Agro Industrial Park, Kon Gaon, Kalyan West, Mumbai, Maharashtra - 421311"
  )
  const [saving, setSaving] = useState(false)

  // Ribbon state — loaded dynamically from API
  const [ribbons, setRibbons] = useState<Array<{
    id: string; text: string; badge?: string; link?: string; bgColor?: string; enabled: boolean
  }>>([
    { id: "ribbon-free-shipping-first10", text: "FREE EXPRESS SHIPPING ON ORDERS OVER ₹999 | Use code FIRST10 for 10% off", badge: "FREE SHIPPING", link: "/shop", bgColor: "bg-red-600", enabled: true },
    { id: "ribbon-2", text: "🛡️ 100% AUTHENTIC INDIAN BATCH LAB CERTIFIED | NO AMINO SPIKING | HASSLE-FREE 7-DAY REPLACEMENTS", badge: "LAB CERTIFIED", link: "/about", bgColor: "bg-zinc-950", enabled: true },
  ])

  useEffect(() => {
    fetch("/api/admin/announcement")
      .then(r => r.json())
      .then(data => {
        if (data.ribbons && data.ribbons.length > 0) {
          setRibbons(data.ribbons)
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ribbons })
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Store configuration and ribbons saved!")
    } catch {
      toast.error("Failed to save settings")
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
            <Settings size={24} className="text-brand-600" />
            Webstore Settings, UPI QR & Legal Licenses
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure business identity, WhatsApp helpline, GST compliance, FSSAI supplement licensing, and announcement ribbons.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Ribbons / Announcement Bar */}
        <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <Megaphone size={16} className="text-amber-500" />
              Storefront Announcement Ribbons
            </h3>
            <a
              href="/admin/announcements"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              Full Editor →
            </a>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Quick toggle ribbons here. Use the <strong>Full Editor</strong> link above to add, edit, reorder or delete ribbons.
          </p>

          {/* Live preview */}
          <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 divide-y divide-white/10">
            {ribbons.length === 0 ? (
              <div className="p-3 text-xs text-zinc-400 text-center bg-zinc-50 dark:bg-zinc-800">No ribbons configured yet.</div>
            ) : (
              ribbons.map((r, i) => (
                <div key={r.id} className={`${r.bgColor || "bg-red-600"} text-white px-4 py-2 flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-2 truncate text-xs font-semibold">
                    {r.badge && <span className="text-[9px] font-black uppercase bg-black/25 px-2 py-0.5 rounded-md shrink-0">{r.badge}</span>}
                    <span className="truncate">{r.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = ribbons.map((rb, idx) => idx === i ? { ...rb, enabled: !rb.enabled } : rb)
                      setRibbons(updated)
                    }}
                    className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                      r.enabled
                        ? "bg-white/20 border-white/30 text-white"
                        : "bg-black/30 border-white/10 text-white/50"
                    }`}
                  >
                    {r.enabled ? "ON" : "OFF"}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick editable fields for each ribbon */}
          {ribbons.map((r, i) => (
            <div key={r.id} className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl space-y-3 bg-zinc-50 dark:bg-zinc-800/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Ribbon #{i + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Enabled</span>
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={e => {
                      const updated = [...ribbons]
                      updated[i] = { ...r, enabled: e.target.checked }
                      setRibbons(updated)
                    }}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Announcement Text</label>
                <input
                  type="text"
                  value={r.text}
                  onChange={e => {
                    const updated = [...ribbons]
                    updated[i] = { ...r, text: e.target.value }
                    setRibbons(updated)
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Badge</label>
                  <input type="text" value={r.badge || ""} onChange={e => { const updated = [...ribbons]; updated[i] = { ...r, badge: e.target.value }; setRibbons(updated) }}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">Link</label>
                  <input type="text" value={r.link || ""} onChange={e => { const updated = [...ribbons]; updated[i] = { ...r, link: e.target.value }; setRibbons(updated) }}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-1">BG Color</label>
                  <select value={r.bgColor || "bg-red-600"} onChange={e => { const updated = [...ribbons]; updated[i] = { ...r, bgColor: e.target.value }; setRibbons(updated) }}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white">
                    <option value="bg-red-600">Red</option>
                    <option value="bg-zinc-950">Dark</option>
                    <option value="bg-amber-600">Amber</option>
                    <option value="bg-emerald-600">Green</option>
                    <option value="bg-blue-600">Blue</option>
                    <option value="bg-purple-600">Purple</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Store Profile */}
        <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <Store size={16} className="text-brand-500" />
            Storefront Identity & Customer Helpline
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Customer Support Phone / WhatsApp
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Store Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Central Warehouse & Dispatch Hub Address
              </label>
              <textarea
                rows={2}
                value={warehouseAddress}
                onChange={(e) => setWarehouseAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* UPI & Payment Settings */}
        <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <QrCode size={16} className="text-emerald-500" />
            UPI QR Settlement & Payment Methods
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Direct Merchant UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-mono"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Generated dynamically on checkout UPI QR</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Payee Legal Name
              </label>
              <input
                type="text"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-mono"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Displayed to customer in GPay/PhonePe</p>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">Enable Cash on Delivery (COD)</p>
                <p className="text-[11px] text-zinc-400">Allow customers to pay cash upon parcel delivery</p>
              </div>
              <button
                type="button"
                onClick={() => setEnableCod(!enableCod)}
                className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                  enableCod ? "bg-brand-600" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    enableCod ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Legal & Compliance (GST + FSSAI) */}
        <div className="card p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <FileCheck size={16} className="text-purple-500" />
            Supplement Licensing & Tax Compliance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                FSSAI License Number (Nutraceuticals)
              </label>
              <input
                type="text"
                value={fssaiLicense}
                onChange={(e) => setFssaiLicense(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-mono"
              />
              <p className="text-[10px] text-emerald-600 mt-1">Printed on product bottles & footer</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                GSTIN Number (Goods & Services Tax)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white font-mono"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Included on customer tax invoices</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
          >
            <Save size={15} /> {saving ? "Saving..." : "Save Store Configuration"}
          </button>
        </div>
      </form>
    </div>
  )
}

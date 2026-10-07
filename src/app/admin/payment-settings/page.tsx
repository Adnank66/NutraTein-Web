"use client"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  QrCode, Save, Check, Upload, ShieldCheck, Banknote, CreditCard,
  Wallet, Plus, Trash2, Star, Eye, EyeOff, AlertTriangle, Loader2
} from "lucide-react"
import { toast } from "sonner"

interface UPIEntry {
  id: string
  upiId: string
  upiName: string
  qrCodeImage: string
  instructions: string
  isDefault: boolean
  isActive: boolean
  label: string // e.g. "Main Store UPI", "Admin 2"
}

const DEFAULT_SETTINGS = {
  upiId: "proteinx@upi",
  upiName: "PROTEINX Supplements Official",
  qrCodeImage: "/assets/payment/upi-qr.svg",
  instructions:
    "Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, BHIM) and enter the 12-digit UTR/Txn ID below.",
  enabled: true,
  // Payment method toggles
  enableCOD: true,
  enableUPI: true,
  enableCash: false,
  customMethods: [] as any[],
}

const cleanImagePath = (path: string | undefined | null): string => {
  if (!path) return ""
  return path.trim().replace(/\\/g, "/")
}

export default function AdminPaymentSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [qrPreview, setQrPreview] = useState<string>("")
  const [previewError, setPreviewError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/payment-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings) {
          const sanitizedQr = cleanImagePath(data.settings.qrCodeImage)
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings, qrCodeImage: sanitizedQr || data.settings.qrCodeImage })
          setQrPreview(sanitizedQr)
          setPreviewError(false)
        }
      })
      .catch(() => {})
  }, [])

  // ── File upload for QR code ──────────────────────────────────────────────
  const handleQRFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setQrPreview(localUrl)
    setPreviewError(false)

    // Upload to server
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Upload failed")

      const cleanedUrl = cleanImagePath(data.url)
      setSettings((p) => ({ ...p, qrCodeImage: cleanedUrl }))
      setQrPreview(cleanedUrl)
      setPreviewError(false)
      toast.success("QR code uploaded successfully!")
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
      setQrPreview(cleanImagePath(settings.qrCodeImage)) // revert preview
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const sanitized = {
        ...settings,
        qrCodeImage: cleanImagePath(settings.qrCodeImage),
      }
      const res = await fetch("/api/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitized),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save settings")
      setSettings(sanitized)
      setSaved(true)
      toast.success("Payment settings saved!")
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      toast.error(err.message || "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  // ── Payment method toggle card ───────────────────────────────────────────
  const MethodToggle = ({
    icon: Icon,
    label,
    desc,
    enabled,
    onChange,
    color = "brand",
  }: {
    icon: any
    label: string
    desc: string
    enabled: boolean
    onChange: (v: boolean) => void
    color?: string
  }) => (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
        enabled
          ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700"
          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 opacity-60"
      }`}
      onClick={() => onChange(!enabled)}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        enabled ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
      }`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{label}</p>
          <div className={`w-11 h-6 rounded-full relative transition-all ${
            enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
          }`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
              enabled ? "left-5.5 translate-x-0.5" : "left-0.5"
            }`} style={{ left: enabled ? "calc(100% - 1.375rem)" : "2px" }} />
          </div>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{desc}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <QrCode className="text-brand-500" size={24} />
          Payment Methods & UPI Configuration
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Manage all payment options shown to customers at checkout — UPI, COD, and Cash on Pickup.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* ── SECTION 1: Payment Methods Toggle ────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            Enabled Payment Methods
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MethodToggle
              icon={QrCode}
              label="UPI / QR Code"
              desc="Google Pay, PhonePe, Paytm, BHIM"
              enabled={settings.enableUPI}
              onChange={(v) => setSettings((p) => ({ ...p, enableUPI: v }))}
            />
            <MethodToggle
              icon={Banknote}
              label="Cash on Delivery (COD)"
              desc="Customer pays in cash at doorstep"
              enabled={settings.enableCOD}
              onChange={(v) => setSettings((p) => ({ ...p, enableCOD: v }))}
            />

            <MethodToggle
              icon={Wallet}
              label="Cash on Pickup"
              desc="Customer pays at pickup point"
              enabled={settings.enableCash}
              onChange={(v) => setSettings((p) => ({ ...p, enableCash: v }))}
            />
          </div>
        </div>



        {/* ── SECTION 3: Manual UPI (QR Code) ─────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            Manual UPI / QR Code Settings
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">
                  UPI Virtual Payment Address (VPA / UPI ID)
                </label>
                <input
                  type="text"
                  value={settings.upiId}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-mono bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  This UPI ID is used to generate deep links for GPay, PhonePe, and Paytm app redirects.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">
                  Merchant / Business Display Name
                </label>
                <input
                  type="text"
                  value={settings.upiName}
                  onChange={(e) => setSettings({ ...settings, upiName: e.target.value })}
                  placeholder="e.g. PROTEINX Supplements Store"
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              {/* QR Code Upload */}
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">
                  QR Code Image
                </label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={settings.qrCodeImage}
                      onChange={(e) => {
                        const raw = e.target.value
                        setSettings({ ...settings, qrCodeImage: raw })
                        setQrPreview(cleanImagePath(raw))
                        setPreviewError(false)
                      }}
                      placeholder="/uploads/qr.png or https://..."
                      className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-mono bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Paste a URL or upload your QR image directly →
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleQRFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-60 transition-colors whitespace-nowrap"
                    >
                      {uploading ? (
                        <><Loader2 size={13} className="animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload size={13} /> Upload QR</>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block mb-1.5">
                  Payment Instructions for Customer
                </label>
                <textarea
                  rows={3}
                  value={settings.instructions}
                  onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
            </div>

            {/* Live QR Preview */}
            <div className="lg:col-span-1">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-3">Live Preview</p>
              <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-zinc-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-center space-y-3">
                <div className="relative w-36 h-36 mx-auto bg-white dark:bg-zinc-800 p-2 rounded-xl border-2 border-emerald-400 shadow flex items-center justify-center overflow-hidden">
                  {qrPreview && !previewError ? (
                    <img
                      src={cleanImagePath(qrPreview)}
                      alt="QR Preview"
                      className="w-full h-full object-contain"
                      onError={() => setPreviewError(true)}
                      onLoad={() => setPreviewError(false)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-zinc-400">
                      <QrCode size={44} className="text-zinc-300 dark:text-zinc-600 mb-1" />
                      {qrPreview && previewError ? (
                        <span className="text-[10px] text-rose-500 font-semibold text-center leading-tight">
                          Invalid or unreadable path
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">No QR uploaded</span>
                      )}
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 flex items-center justify-center rounded-xl">
                      <Loader2 size={24} className="animate-spin text-brand-600" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">{settings.upiName}</p>
                  <div className="mt-1 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200 inline-block">
                    {settings.upiId}
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {settings.instructions}
                </p>
                <div className="flex gap-1.5 justify-center">
                  <span className="text-[9px] font-bold bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">GPay</span>
                  <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded-full">PhonePe</span>
                  <span className="text-[9px] font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full">Paytm</span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500 space-y-1">
                <p className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" /> Changes reflect on checkout instantly
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Custom Methods (e.g. Bank Transfer) ──────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              Custom Payment Methods (Bank Transfer, etc.)
            </h2>
            <button
              type="button"
              onClick={() => setSettings({
                ...settings,
                customMethods: [...(settings.customMethods || []), { id: `custom_${Date.now()}`, name: "Bank Transfer", description: "Direct bank transfer", details: "Account: \nIFSC: ", enabled: true }]
              })}
              className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> Add Method
            </button>
          </div>
          
          {(!settings.customMethods || settings.customMethods.length === 0) ? (
            <p className="text-xs text-zinc-400">No custom methods added. Click 'Add Method' to create one like Bank Transfer.</p>
          ) : (
            <div className="space-y-4">
              {settings.customMethods.map((cm, idx) => (
                <div key={cm.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-3 relative group">
                  <button type="button" onClick={() => {
                    const next = [...settings.customMethods]; next.splice(idx, 1);
                    setSettings({...settings, customMethods: next})
                  }} className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-2 gap-3 pr-8">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">Method Name</label>
                      <input type="text" value={cm.name} onChange={e => {
                        const next = [...settings.customMethods]; next[idx].name = e.target.value; setSettings({...settings, customMethods: next})
                      }} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block mb-1">Short Description</label>
                      <input type="text" value={cm.description} onChange={e => {
                        const next = [...settings.customMethods]; next[idx].description = e.target.value; setSettings({...settings, customMethods: next})
                      }} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 block mb-1">Payment Details / Instructions (Account No, IFSC, etc.)</label>
                    <textarea rows={3} value={cm.details} onChange={e => {
                      const next = [...settings.customMethods]; next[idx].details = e.target.value; setSettings({...settings, customMethods: next})
                    }} className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none" />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" id={`cm_en_${cm.id}`} checked={cm.enabled} onChange={e => {
                      const next = [...settings.customMethods]; next[idx].enabled = e.target.checked; setSettings({...settings, customMethods: next})
                    }} className="rounded border-zinc-300 text-brand-600" />
                    <label htmlFor={`cm_en_${cm.id}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Enable this method on checkout</label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-6 py-3 rounded-xl disabled:opacity-60 transition-colors"
          >
            {saved ? <Check size={16} /> : loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {loading ? "Saving..." : saved ? "Saved!" : "Save Payment Settings"}
          </button>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Changes apply immediately to the checkout page.
          </p>
        </div>
      </form>
    </div>
  )
}

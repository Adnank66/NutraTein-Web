"use client"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Camera, Loader2, Save, Trash2, AlertTriangle, ShieldAlert, X } from "lucide-react"
import { signOut } from "next-auth/react"

export default function SettingsPage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [image, setImage] = useState("")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Account deletion states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) {
          setName(data.user.name || "")
          setPhone(data.user.phone || "")
          setEmail(data.user.email || "")
          setImage(data.user.image || "")
          setRole(data.user.role || "USER")
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to upload image")
      setImage(data.url)

      // Auto-save the profile picture update
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, image: data.url }),
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
        body: JSON.stringify({ name, phone, image }),
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

  // ── Account Deletion Handlers ──
  const handleOpenDeleteModal = () => {
    setShowDeleteModal(true)
    setOtpSent(false)
    setOtpCode("")
  }

  const handleSendDeleteOtp = async () => {
    setSendingOtp(true)
    try {
      const res = await fetch("/api/user/delete-account/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send verification code")
      setOtpSent(true)
      setCountdown(60)
      toast.success("Verification code sent to " + email)
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code")
    } finally {
      setSendingOtp(false)
    }
  }

  const handleConfirmDelete = async () => {
    const cleanCode = otpCode.trim()
    if (!cleanCode || cleanCode.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code")
      return
    }

    setDeletingAccount(true)
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete account")

      toast.success("Account deleted successfully. Logging out...")
      setShowDeleteModal(false)

      // Sign out and redirect to home
      setTimeout(() => {
        signOut({ callbackUrl: "/" })
      }, 1000)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account")
      setDeletingAccount(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-6 max-w-xl flex items-center justify-center py-20 dark:bg-zinc-900 dark:border-zinc-800">
        <Loader2 className="animate-spin text-red-500" />
      </div>
    )
  }

  const isUserOnly = role === "USER" || (role !== "ADMIN" && role !== "SUPER_ADMIN")

  return (
    <div className="space-y-6 max-w-xl">
      <div className="card p-6 space-y-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-dark-900 dark:text-white">Account Settings</h1>
          <p className="text-xs text-dark-500 dark:text-zinc-400 mt-0.5">
            Update your personal details and profile picture.
          </p>
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
                {name ? name.charAt(0).toUpperCase() : email ? email.charAt(0).toUpperCase() : "U"}
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

          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Danger Zone: Delete Account (Option for Users with Email Verification) ── */}
      <div className="card p-6 border-red-200 dark:border-red-950/60 bg-red-50/40 dark:bg-red-950/10 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-red-900 dark:text-red-300">Danger Zone: Delete Account</h2>
            <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-0.5 leading-relaxed">
              Permanently delete your account and remove all personal information, saved addresses, wishlist items, and past order records from NutraTein.
            </p>
          </div>
        </div>

        {isUserOnly ? (
          <div className="pt-2 border-t border-red-200/60 dark:border-red-900/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Requires 6-digit email verification code sent to <strong>{email}</strong>
            </span>
            <button
              type="button"
              onClick={handleOpenDeleteModal}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-red-600/20 shrink-0"
            >
              <Trash2 size={14} />
              Delete Account
            </button>
          </div>
        ) : (
          <div className="pt-2 border-t border-red-200/60 dark:border-red-900/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                Admin Protected
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Self-deletion is disabled for Administrator accounts to protect store ownership. This option is active only for regular customer accounts.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Account Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <ShieldAlert size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                  Delete NutraTein Account
                </h3>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-0.5">
                  Permanent & Irreversible Action
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60">
              To protect your privacy and account security, a 6-digit confirmation code must be verified on your registered email (<strong>{email}</strong>).
            </p>

            {!otpSent ? (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendDeleteOtp}
                  disabled={sendingOtp}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    "Send Verification Code to Email"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 font-semibold"
                >
                  Cancel and Keep Account
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Enter 6-digit Code:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="w-full text-center text-2xl font-mono font-black tracking-widest py-3 px-4 rounded-2xl border-2 border-red-300 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20 text-zinc-900 dark:text-white focus:outline-none focus:border-red-600"
                    autoFocus
                  />
                  <div className="flex justify-between items-center mt-2 px-1">
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Code valid for 10 minutes
                    </span>
                    {countdown > 0 ? (
                      <span className="text-[11px] text-zinc-400 font-mono">
                        Resend in {countdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendDeleteOtp}
                        disabled={sendingOtp}
                        className="text-[11px] font-bold text-red-600 hover:text-red-700 underline"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deletingAccount || otpCode.length !== 6}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/25"
                  >
                    {deletingAccount ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Deleting Account...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Permanently Delete My Account
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deletingAccount}
                    className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
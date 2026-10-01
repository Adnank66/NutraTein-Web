"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Lock, Mail, User, Phone, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, MessageSquare } from "lucide-react"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    whatsappOptIn: true,
  })

  // OTP state
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [loading, setLoading] = useState(false)

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  // Send OTP handler
  const handleSendOtp = async () => {
    if (!formData.email || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address first.")
      return
    }

    setSendingOtp(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, type: "REGISTER" }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code")
      }

      setOtpSent(true)
      setResendTimer(60)
      toast.success("Verification code sent to your email! Please check your inbox.")
      
      // Auto-fill dev code if available in dev mode
      if (data.devCode) {
        console.log("Dev verification code:", data.devCode)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send code")
    } finally {
      setSendingOtp(false)
    }
  }

  // Verify OTP handler
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      toast.error("Please enter the 6-digit verification code.")
      return
    }

    setVerifyingOtp(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: otpCode }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Invalid verification code")
      }

      setIsEmailVerified(true)
      toast.success("Email verified successfully! You can now finish creating your account.")
    } catch (err: any) {
      toast.error(err.message || "Verification failed")
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEmailVerified && !otpSent) {
      toast.error("Please click 'Send Verification Code' to verify your email first.")
      return
    }

    if (!isEmailVerified) {
      toast.error("Please enter the 6-digit code sent to your email to verify your address.")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          otpCode: otpCode.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Registration failed")

      toast.success("Authorized account created! Welcome to NUTRA TEIN.")
      router.push("/login")
    } catch (err: any) {
      toast.error(err.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
            <span className="font-black text-lg text-white italic">N</span>
          </div>
          <span className="font-display text-2xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">
            NUTRA<span className="text-brand-500">TEIN</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Create an Account</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Already verified? <Link href="/login" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">Sign In</Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Email Address with Live Verification Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Email Address (Verification Required)
                </label>
                {isEmailVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} /> Verified
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    disabled={isEmailVerified}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      setIsEmailVerified(false)
                      setOtpSent(false)
                    }}
                    className={`w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl border ${
                      isEmailVerified
                        ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 text-zinc-900 dark:text-white"
                        : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    } placeholder-zinc-400 focus:outline-none focus:border-brand-500 transition-colors`}
                    required
                  />
                </div>
                {!isEmailVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || resendTimer > 0 || !formData.email}
                    className="px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1"
                  >
                    {sendingOtp ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : resendTimer > 0 ? (
                      `${resendTimer}s`
                    ) : otpSent ? (
                      "Resend Code"
                    ) : (
                      "Send Code"
                    )}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                We send an instant 6-digit code to guarantee only real, authorized emails are registered.
              </p>
            </div>

            {/* OTP Verification Input Box (Visible once code sent and not yet verified) */}
            {otpSent && !isEmailVerified && (
              <div className="p-3.5 rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-900 dark:text-brand-300">
                    Enter 6-Digit Email Code
                  </span>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono">
                    Check Spam / Inbox
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 text-center font-mono text-base font-black tracking-widest py-2 rounded-xl border border-brand-300 dark:border-brand-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otpCode.length < 6}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    {verifyingOtp ? <RefreshCw size={13} className="animate-spin" /> : "Verify Code"}
                  </button>
                </div>
              </div>
            )}

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Phone Number (For WhatsApp & SMS updates)
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* WhatsApp Updates Checkbox */}
            <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.whatsappOptIn}
                  onChange={(e) => setFormData({ ...formData, whatsappOptIn: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <div className="text-xs">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    Get updates on WhatsApp
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Receive instant tracking details, dispatch manifest, and new supplement deals directly on WhatsApp.
                  </p>
                </div>
              </label>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Password (Min 6 chars)
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isEmailVerified}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Creating Account...
                </>
              ) : !isEmailVerified ? (
                <>
                  <ShieldCheck size={16} /> Verify Email to Continue
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-zinc-500 dark:text-zinc-400">
            🔒 By creating an account, your details are encrypted and securely authenticated with NUTRA TEIN.
          </p>
        </div>
      </div>
    </div>
  )
}
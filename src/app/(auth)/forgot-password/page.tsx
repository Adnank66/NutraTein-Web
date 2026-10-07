"use client"
import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowRight, RefreshCw, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), type: "RESET" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send code")
      setOtpSent(true)
      toast.success("Verification code sent to your email!")
    } catch (err: any) {
      toast.error(err.message || "Could not send verification code")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length < 6) return
    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid code")
      setOtpVerified(true)
      toast.success("Code verified! Set your new password below.")
    } catch (err: any) {
      toast.error(err.message || "Invalid or expired code")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to reset password")
      setSuccess(true)
      toast.success("Password reset successfully! You can now log in.")
    } catch (err: any) {
      toast.error(err.message || "Could not reset password")
    } finally {
      setLoading(false)
    }
  }

  const stepLabel = success
    ? "Password reset!"
    : otpVerified
    ? "Set your new password"
    : otpSent
    ? "Enter the 6-digit code sent to your email"
    : "Enter your email to receive a reset code"

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block mb-4">
            <span className="font-display text-2xl font-black text-white tracking-tight uppercase">
              NUTRA<span className="text-red-500">TEIN</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-white">Reset Password</h2>
          <p className="text-xs text-zinc-400">{stepLabel}</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2">
          {["Email", "Verify", "Password"].map((step, i) => {
            const active = i === 0 ? true : i === 1 ? otpSent : otpVerified
            const done = i === 0 ? otpSent || otpVerified || success : i === 1 ? otpVerified || success : success
            return (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  done ? "bg-emerald-500 text-white" : active ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-500"
                }`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] font-semibold ${done || active ? "text-zinc-300" : "text-zinc-600"}`}>{step}</span>
                {i < 2 && <div className={`w-8 h-px ${done ? "bg-emerald-500" : "bg-zinc-700"}`} />}
              </div>
            )
          })}
        </div>

        {success ? (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <CheckCircle2 size={48} className="text-emerald-500" />
            </div>
            <p className="text-sm text-zinc-300">
              Your password has been reset successfully!
            </p>
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              Login Now <ArrowRight size={14} />
            </Link>
          </div>
        ) : otpVerified ? (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full text-xs font-semibold pl-10 pr-10 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full text-xs font-semibold pl-10 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <><RefreshCw size={14} className="animate-spin" /> Resetting...</>
              ) : (
                <>Set New Password <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs font-semibold pl-10 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <><RefreshCw size={14} className="animate-spin" /> Sending...</>
              ) : (
                <>Send Reset Code <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Enter 6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center font-mono text-base font-black tracking-widest py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <><RefreshCw size={14} className="animate-spin" /> Verifying...</>
              ) : (
                <>Verify Code <ArrowRight size={14} /></>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtpCode(""); }}
              className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Use a different email
            </button>
          </form>
        )}

        <div className="text-center pt-4 border-t border-zinc-900">
          <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
"use client"
import { useState, useEffect, Suspense } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Truck, FlaskConical, KeyRound, RefreshCw, ArrowRight, MessageSquare, Smartphone } from "lucide-react"
import { toast } from "sonner"

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/nutratein?stkn=MXd0ODBqMWs0ZmRvMA==",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    color: "hover:text-pink-500 hover:border-pink-500/50",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@nutratein",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    color: "hover:text-red-500 hover:border-red-500/50",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/nutratein",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: "hover:text-blue-500 hover:border-blue-500/50",
  },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || ""
  
  // Login method tabs: PASSWORD vs OTP
  const [authMode, setAuthMode] = useState<"PASSWORD" | "OTP">("PASSWORD")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [whatsappOptIn, setWhatsappOptIn] = useState(false)

  // OTP login state
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [revealedOtp, setRevealedOtp] = useState("")

  // Auto-load saved email from client cookie/localStorage
  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|; )proteinx_user_email=([^;]*)/)
      const savedEmail = match ? decodeURIComponent(match[1]) : localStorage.getItem("proteinx_saved_email")
      if (savedEmail) {
        setEmail(savedEmail)
      }
    } catch {}
  }, [])

  // Timer countdown
  useEffect(() => {
    let interval: any
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  // Send login OTP
  const handleSendLoginOtp = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address first.")
      return
    }

    setSendingOtp(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), type: "LOGIN" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send code")

      setOtpSent(true)
      setResendTimer(60)
      if (data.devCode) {
        setRevealedOtp(data.devCode)
        setOtpCode(data.devCode)
      }
      toast.success("Verification code sent to your email! Please check your inbox.")
    } catch (err: any) {
      toast.error(err.message || "Could not send verification code")
    } finally {
      setSendingOtp(false)
    }
  }

  // Handle form submission (Password or OTP)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const cleanEmail = email.trim().toLowerCase()

    try {
      let credentialsPayload: any = {}
      if (authMode === "OTP") {
        credentialsPayload = { email: cleanEmail, otp: otpCode.trim(), whatsappOptIn: "false", redirect: false }
      } else {
        credentialsPayload = { email: cleanEmail, password, whatsappOptIn: "false", redirect: false }
      }

      const res = await signIn("credentials", credentialsPayload)

      if (res?.error) {
        toast.error(
          authMode === "OTP"
            ? "Invalid or expired verification code. Please try again."
            : "Invalid email or password. Please verify and try again."
        )
      } else {
        // Save login email
        if (rememberMe) {
          document.cookie = `proteinx_user_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=31536000; SameSite=Lax`
          try {
            localStorage.setItem("proteinx_saved_email", cleanEmail)
          } catch {}
        }

        const session = await getSession()
        const role = (session?.user as any)?.role

        if (role === "ADMIN") {
          toast.success("Administrator session authorized! Welcome to Admin Panel.")
          window.location.href = "/admin"
        } else if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("/admin") && !callbackUrl.startsWith("/login")) {
          toast.success(`Welcome back, ${session?.user?.name?.split(" ")[0] || "Athlete"}!`)
          window.location.href = callbackUrl
        } else {
          toast.success(`Welcome back, ${session?.user?.name?.split(" ")[0] || "Athlete"}!`)
          try {
            const orderCheckRes = await fetch("/api/user/has-orders")
            const orderCheckData = await orderCheckRes.json()
            if (orderCheckData?.hasOrders) {
              window.location.href = "/account/orders"
            } else {
              window.location.href = "/"
            }
          } catch {
            window.location.href = "/"
          }
        }
      }
    } catch {
      toast.error("Failed to sign in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL (hidden on mobile, visible lg+) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(234,88,12,0.18)_0%,_transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(249,115,22,0.10)_0%,_transparent_60%)] pointer-events-none" />

        {/* Top — Brand logo */}
        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              <span className="font-black text-base text-zinc-950 italic">N</span>
            </div>
            <span className="font-display text-2xl font-black text-white tracking-tight uppercase">
              NUTRA<span className="text-red-500"> TEIN</span>
            </span>
          </Link>
        </div>

        {/* Centre — hero copy */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 xl:px-14">
          <p className="text-xs font-bold text-red-500 tracking-widest uppercase mb-4">Clean Fitness Nutrition</p>
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
            Fuel Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">Performance</span>
          </h1>
          <p className="mt-4 text-zinc-400 text-sm leading-relaxed max-w-sm">
            Sign in to track your orders, receive WhatsApp courier updates, and unlock exclusive member deals.
          </p>

          {/* Social proof stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-sm">
            {[
              { value: "50K+", label: "Athletes" },
              { value: "4.9★", label: "Avg Rating" },
              { value: "100%", label: "Authentic" },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-lg font-black text-white">{s.value}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-col gap-2.5">
            {[
              { icon: ShieldCheck, text: "100% Lab Tested & Certified" },
              { icon: Truck, text: "Same-Day Dispatch & Live WhatsApp Alerts" },
              { icon: FlaskConical, text: "Zero Adulteration Guarantee" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-xs text-zinc-400">
                <Icon size={14} className="text-red-500 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Social Handles in Left Panel */}
        <div className="relative z-10 p-10 flex items-center justify-between border-t border-white/10">
          <span className="text-xs text-zinc-500">© {new Date().getFullYear()} NUTRA TEIN</span>
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`NUTRA TEIN on ${s.name}`}
                className={`w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center transition-all ${s.color}`}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Auth Form) ── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col justify-center items-center p-6 sm:p-10 bg-zinc-950">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">Welcome Back</h2>
            <p className="text-xs text-zinc-400">Sign in with your password or instant email verification code</p>
          </div>

          {/* Login Mode Toggle Tabs */}
          <div className="flex p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => setAuthMode("PASSWORD")}
              className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all ${
                authMode === "PASSWORD"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("OTP")}
              className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === "OTP"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Email OTP
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
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

            {/* PASSWORD MODE: Password Field */}
            {authMode === "PASSWORD" && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs font-semibold pl-10 pr-10 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="text-right mt-1.5">
                  <Link href="/forgot-password" className="text-[10px] sm:text-xs text-red-500 hover:text-red-400 font-bold hover:underline">
                    Forgot Password?
                  </Link>
                </div>
              </div>
            )}

            {/* OTP MODE: Send Code button + 6-digit input */}
            {authMode === "OTP" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSendLoginOtp}
                    disabled={sendingOtp || resendTimer > 0 || !email}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-xs border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {sendingOtp ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : resendTimer > 0 ? (
                      `Resend Code in ${resendTimer}s`
                    ) : otpSent ? (
                      "Resend Verification Code"
                    ) : (
                      "Send One-Time Code via Email"
                    )}
                  </button>
                </div>

                {otpSent && (
                  <div className="space-y-2.5 animate-fade-in pt-1">
                    {revealedOtp && (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                        <span className="text-[11px] text-amber-300 font-semibold block">
                          Your Verification Code:
                        </span>
                        <span className="text-xl font-mono font-black text-amber-400 tracking-widest">
                          {revealedOtp}
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          (Code pre-filled below for instant verification)
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">
                        Enter 6-Digit Code
                      </label>
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
                  </div>
                )}
              </div>
            )}

            {/* WhatsApp Updates Checkbox */}
            <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 hover:border-emerald-500/40 transition-colors">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/20"
                />
                <div className="text-xs">
                  <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Get updates on WhatsApp
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Receive dispatch notifications, live tracking, and deals directly on WhatsApp.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-red-500/20"
                />
                <span className="text-[11px] text-zinc-400">Remember email</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || (authMode === "OTP" && (!otpSent || otpCode.length < 6))}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Verifying...
                </>
              ) : authMode === "OTP" ? (
                <>
                  Verify & Sign In <ArrowRight size={14} />
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="text-center pt-2">
            <p className="text-xs text-zinc-400">
              New to NUTRA TEIN?{" "}
              <Link href="/register" className="text-red-500 hover:text-red-400 font-bold hover:underline">
                Create an Authorized Account
              </Link>
            </p>
          </div>

          {/* Social Handles at bottom of Login */}
          <div className="pt-4 border-t border-zinc-900 text-center space-y-3">
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Follow Us on Social Media
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-1.5 text-xs font-semibold transition-all ${s.color}`}
                >
                  {s.icon}
                  <span>{s.name}</span>
                </a>
              ))}
            </div>
            <div>
              <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                ← Return to Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
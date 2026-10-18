"use client"

import { useState } from "react"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function AdminDirectLogin() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked) {
      toast.error("Too many failed attempts. Please wait 2 minutes.")
      return
    }
    setLoading(true)

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (res?.error) {
        setPassword("")
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        if (newAttempts >= 5) {
          setLocked(true)
          setTimeout(() => { setLocked(false); setAttempts(0) }, 2 * 60 * 1000)
          toast.error("Access locked for 2 minutes due to repeated failed attempts.")
        } else {
          toast.error(`Invalid credentials. Password cleared. (${5 - newAttempts} attempts remaining)`)
        }
      } else {
        setAttempts(0)
        toast.success("Administrator session authorized!")
        window.location.href = "/admin"
      }
    } catch (err: any) {
      setPassword("")
      toast.error("Sign in failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950/80 to-zinc-950 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl mb-4 text-red-500">
            <ShieldCheck size={28} />
          </div>
          <div className="flex flex-col items-center justify-center gap-2">
            <Image
              src="/assets/logos/nutratein-logo.png"
              alt="NutraTein"
              width={160}
              height={70}
              className="h-9 w-auto object-contain invert brightness-200"
              priority
            />
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 tracking-wider">
              Admin Console
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-3">Administrator Portal</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Authorized management credentials required.
          </p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5">
          {locked && (
            <div className="bg-red-950/60 border border-red-800 rounded-xl p-3 text-xs text-red-300 flex items-center justify-between gap-2">
              <span>🔒 Account locked due to repeated attempts.</span>
              <button
                type="button"
                onClick={() => { setLocked(false); setAttempts(0) }}
                className="px-2 py-0.5 text-[10px] bg-red-800 hover:bg-red-700 text-white rounded font-bold cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || locked}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-wider text-white shadow-md shadow-red-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Access Admin Console <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-zinc-800/80">
            <a
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1"
            >
              ← Return to Storefront
            </a>
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-600 mt-4">
          🔐 Unauthorized access attempts are logged and monitored.
        </p>
      </div>
    </div>
  )
}

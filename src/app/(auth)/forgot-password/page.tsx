"use client"
import { useState } from "react"
import Link from "next/link"
import { Zap, Mail, ArrowRight, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSent(true)
    toast.success("Password reset instructions sent.")
  }

  return (
    <div className="min-h-screen bg-dark-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <span className="font-display text-2xl font-bold text-dark-900">
            PROTEIN<span className="text-brand-500">X</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-dark-900">Reset Password</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card p-8 border border-dark-100 space-y-6">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 size={40} className="text-green-500 mx-auto" />
              <h3 className="font-bold text-dark-900">Check Your Inbox</h3>
              <p className="text-xs text-dark-500">
                Instructions sent to <strong>{email}</strong>.
              </p>
              <Link href="/auth/login" className="btn-primary text-xs inline-flex">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-dark-500">
                Enter your email address and we will send a password reset link.
              </p>
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-9 text-xs"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-3 text-sm">
                Send Reset Link <ArrowRight size={14} />
              </button>
              <div className="text-center">
                <Link href="/auth/login" className="text-xs text-dark-500 hover:text-dark-900">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
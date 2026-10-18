"use client"

import { useState, useEffect } from "react"
import { Shield, User, Mail, Clock, RefreshCw, Trash2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface LoginEntry {
  id: string
  email: string
  name?: string
  role?: string
  ipAddress?: string
  userAgent?: string
  status?: string
  timestamp: string
}

interface UserRecord {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export default function LoginHistoryPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [history, setHistory] = useState<LoginEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login-history")
      const data = await res.json()
      setUsers(data.users || [])
      setHistory(data.history || [])
    } catch {
      toast.error("Failed to load login history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear the entire login history?")) {
      return
    }

    setClearing(true)
    try {
      const res = await fetch("/api/admin/login-history", { method: "DELETE" })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Login history cleared successfully!")
        setHistory([])
      } else {
        toast.error(data.error || "Failed to clear login history")
      }
    } catch {
      toast.error("Network error while clearing login history")
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
            <Shield className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Login History &amp; Access Log</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Authenticated user sign-in sessions and administrative access tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          <button
            onClick={handleClearHistory}
            disabled={clearing || (history.length === 0 && users.length === 0)}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 dark:text-rose-400 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-40"
          >
            <Trash2 size={13} /> Clear History
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4">
          <p className="text-2xl font-black text-blue-600">{users.length}</p>
          <p className="text-xs text-zinc-500">Registered Accounts</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4">
          <p className="text-2xl font-black text-purple-600">
            {users.filter((u) => u.role === "ADMIN" || (u.role as string) === "SUPER_ADMIN").length}
          </p>
          <p className="text-xs text-zinc-500">Admins</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4">
          <p className="text-2xl font-black text-emerald-600">{history.length}</p>
          <p className="text-xs text-zinc-500">Recorded Sessions</p>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            {history.length > 0 ? "Recent Authentication Events" : "Account Access Directory"}
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            {history.length > 0 ? `${history.length} logged events` : `${users.length} accounts`}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-400">Loading authentication records...</div>
        ) : history.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                <th className="text-left p-4 text-xs font-bold text-zinc-500 uppercase">User / Email</th>
                <th className="text-left p-4 text-xs font-bold text-zinc-500 uppercase">Role</th>
                <th className="text-left p-4 text-xs font-bold text-zinc-500 uppercase">IP Address</th>
                <th className="text-left p-4 text-xs font-bold text-zinc-500 uppercase">Status</th>
                <th className="text-left p-4 text-xs font-bold text-zinc-500 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                        <User size={13} className="text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.name || item.email}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">{item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.role === "ADMIN" || item.role === "SUPER_ADMIN"
                          ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {item.role || "CUSTOMER"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                      {item.ipAddress || "127.0.0.1"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={12} /> {item.status || "SUCCESS"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-zinc-500">{new Date(item.timestamp).toLocaleString("en-IN")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : users.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                <th className="text-left p-4 text-xs font-bold text-zinc-500 uppercase">User</th>
                <th className="text-left p-4 text-xs font-bold text-zinc-500 uppercase">Email</th>
                <th className="text-left p-4 text-xs font-bold text-zinc-500 uppercase">Role</th>
                <th className="text-left p-4 text-xs font-bold text-zinc-500 uppercase">Registered</th>
                <th className="text-left p-4 text-xs font-bold text-zinc-500 uppercase">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                        <User size={13} className="text-zinc-500" />
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {user.name || "Customer"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">{user.email}</span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        user.role === "ADMIN" || (user.role as string) === "SUPER_ADMIN"
                          ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-zinc-500">
                      {new Date(user.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-zinc-500">
                      {new Date(user.updatedAt).toLocaleDateString("en-IN")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Shield size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">No login history or user records found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

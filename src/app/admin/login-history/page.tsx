"use client"
import { useState, useEffect } from "react"
import { Shield, User, Mail, Clock, RefreshCw } from "lucide-react"
import { toast } from "sonner"

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
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login-history")
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      toast.error("Failed to load user history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
            <Shield className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Login History</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Registered users and their account activity</p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-4 py-2 rounded-xl"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4">
          <p className="text-2xl font-black text-blue-600">{users.length}</p>
          <p className="text-xs text-zinc-500">Total Users</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4">
          <p className="text-2xl font-black text-purple-600">{users.filter(u => u.role === 'ADMIN').length}</p>
          <p className="text-xs text-zinc-500">Admins</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4">
          <p className="text-2xl font-black text-emerald-600">{users.filter(u => u.role === 'USER').length}</p>
          <p className="text-xs text-zinc-500">Customers</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading user records...</div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden">
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
                <tr key={user.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                        <User size={13} className="text-zinc-500" />
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user.name || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">{user.email}</span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>{user.role}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-zinc-500">{new Date(user.createdAt).toLocaleDateString('en-IN')}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-zinc-500">{new Date(user.updatedAt).toLocaleDateString('en-IN')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12">
              <Shield size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">No user records found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

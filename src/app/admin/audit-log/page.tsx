"use client"
import { useState, useEffect } from "react"
import { Shield, Search, Filter, ChevronDown, ChevronUp } from "lucide-react"

const ACTION_COLORS: Record<string, string> = {
  CREATED: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  UPDATED: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400",
  DELETED: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400",
  STATUS_CHANGED: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
  ADJUSTED: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400",
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filters, setFilters] = useState({ action: "", resource: "", adminEmail: "", from: "", to: "" })

  const fetchLogs = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", page.toString())
    if (filters.action) params.set("action", filters.action)
    if (filters.resource) params.set("resource", filters.resource)
    if (filters.adminEmail) params.set("adminEmail", filters.adminEmail)
    if (filters.from) params.set("from", filters.from)
    if (filters.to) params.set("to", filters.to)

    try {
      const res = await fetch(`/api/admin/audit-log?${params}`)
      const d = await res.json()
      setLogs(d.logs || [])
      setTotal(d.total || 0)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchLogs() }, [page, filters])

  const actionColor = (action: string) => {
    for (const key of Object.keys(ACTION_COLORS)) {
      if (action.includes(key)) return ACTION_COLORS[key]
    }
    return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Shield className="text-zinc-600 dark:text-zinc-400" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Admin Audit Log</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{total} total entries — immutable record of all admin actions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { key: "action", placeholder: "Filter by action..." },
            { key: "resource", placeholder: "Resource (Product, Order...)" },
            { key: "adminEmail", placeholder: "Admin email..." },
            { key: "from", placeholder: "", type: "date" },
            { key: "to", placeholder: "", type: "date" },
          ].map(({ key, placeholder, type }) => (
            <input key={key} type={type || "text"} placeholder={placeholder}
              value={(filters as any)[key]}
              onChange={e => { setFilters(p => ({ ...p, [key]: e.target.value })); setPage(1) }}
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white" />
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-400">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Shield size={40} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500">No audit log entries found</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {logs.map(log => (
              <div key={log.id}>
                <div className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${actionColor(log.action)}`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {log.resource}: {log.resourceId?.slice(-8) || '—'}
                    </p>
                    <p className="text-[10px] text-zinc-500">{log.adminName || log.adminEmail || 'System'}</p>
                  </div>
                  <p className="text-[10px] text-zinc-400 shrink-0">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </p>
                  {expanded === log.id ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                </div>
                {expanded === log.id && (
                  <div className="px-4 pb-4 bg-zinc-50 dark:bg-zinc-800/30 text-xs space-y-2">
                    {log.reason && <p><strong>Reason:</strong> {log.reason}</p>}
                    {log.oldValue && (
                      <div><strong>Before:</strong><pre className="mt-1 bg-zinc-100 dark:bg-zinc-800 rounded p-2 overflow-x-auto text-[10px]">{JSON.stringify(JSON.parse(log.oldValue), null, 2)}</pre></div>
                    )}
                    {log.newValue && (
                      <div><strong>After:</strong><pre className="mt-1 bg-zinc-100 dark:bg-zinc-800 rounded p-2 overflow-x-auto text-[10px]">{JSON.stringify(JSON.parse(log.newValue), null, 2)}</pre></div>
                    )}
                    {log.ipAddress && <p><strong>IP:</strong> {log.ipAddress}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* Pagination */}
        {total > 50 && (
          <div className="flex justify-center gap-2 p-4 border-t border-zinc-100 dark:border-zinc-800">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg disabled:opacity-40">Previous</button>
            <span className="px-3 py-1.5 text-xs text-zinc-500">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg">Next</button>
          </div>
        )}
      </div>
    </div>
  )
}

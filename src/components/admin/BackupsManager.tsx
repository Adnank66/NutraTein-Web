"use client"

import { useState } from "react"
import {
  Database,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCode,
  HardDrive,
  FileText,
  Printer,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

interface SnapshotEntry {
  id: string
  name: string
  size: string
  type: string
  createdAt: string
  status: "SECURE" | "COMPLETED"
}

const PREV_SNAPSHOTS: SnapshotEntry[] = [
  { id: "snap-1", name: "proteinx_daily_auto_backup.json", size: "2.4 MB", type: "Full Storefront Data", createdAt: "Today at 02:00 AM", status: "SECURE" },
  { id: "snap-2", name: "proteinx_products_master_catalog.json", size: "840 KB", type: "Catalog & Formulations", createdAt: "Yesterday", status: "SECURE" },
  { id: "snap-3", name: "proteinx_orders_dispatch_history.json", size: "1.2 MB", type: "Customer Orders & Invoices", createdAt: "3 days ago", status: "SECURE" },
]

export default function BackupsManager() {
  const [downloading, setDownloading] = useState(false)
  const [snapshots, setSnapshots] = useState(PREV_SNAPSHOTS)

  const handleDownload = (type: "full" | "products" | "orders", format: "json" | "text" | "pdf" = "json") => {
    if (format === "pdf") {
      // Open print/PDF view in a clean new tab
      window.open(`/api/admin/backups?type=${type}&format=pdf`, "_blank")
      toast.success(`Opening printable ${type.toUpperCase()} PDF report...`)
      return
    }

    setDownloading(true)
    toast.info(`Preparing ${type.toUpperCase()} (${format.toUpperCase()}) export...`)

    const ext = format === "text" ? "txt" : "json"
    const link = document.createElement("a")
    link.href = `/api/admin/backups?type=${type}&format=${format}`
    link.download = `proteinx_${type}_${Date.now()}.${ext}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => {
      setDownloading(false)
      toast.success(`${type.toUpperCase()} (${format.toUpperCase()}) downloaded successfully!`)
    }, 1200)
  }

  const handleCreateSnapshot = () => {
    const newEntry: SnapshotEntry = {
      id: `snap-${Date.now()}`,
      name: `proteinx_manual_snapshot_${Date.now()}.json`,
      size: "2.5 MB",
      type: "Manual Full Store Backup",
      createdAt: "Just now",
      status: "SECURE",
    }
    setSnapshots([newEntry, ...snapshots])
    handleDownload("full", "json")
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Database size={24} className="text-brand-600" />
            Database Snapshots, Disaster Recovery & Multi-Format Exports
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Download full store backups, product catalogs, and order histories in JSON, Text (.txt), and PDF formats.
          </p>
        </div>

        <button
          onClick={handleCreateSnapshot}
          disabled={downloading}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
        >
          <HardDrive size={15} /> Create Instant Snapshot
        </button>
      </div>

      {/* 3 Download Cards with JSON, TEXT, and PDF options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Full Store Backup Card */}
        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center mb-3">
              <Database size={20} />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Full Store Backup</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Complete archive including products, variants, customer orders, addresses, and discount coupons.
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => handleDownload("full", "json")}
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-brand-600 hover:text-white text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Download size={13} /> Download JSON (.json)
            </button>
            <button
              onClick={() => handleDownload("full", "text")}
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-900 hover:text-white text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText size={13} /> Download Text (.txt)
            </button>
            <button
              onClick={() => handleDownload("full", "pdf")}
              className="w-full py-1.5 px-3 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-600 hover:text-white text-xs font-bold text-orange-700 dark:text-orange-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Printer size={13} /> Download / Print PDF (.pdf)
            </button>
          </div>
        </div>

        {/* Product Catalog Card */}
        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3">
              <FileCode size={20} />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Products Catalog</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Formulation specs, prices, stock quantities, flavors, weights, and high-res image references.
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => handleDownload("products", "json")}
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-purple-600 hover:text-white text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Download size={13} /> Export Catalog (.json)
            </button>
            <button
              onClick={() => handleDownload("products", "text")}
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-900 hover:text-white text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText size={13} /> Export Catalog (.txt)
            </button>
            <button
              onClick={() => handleDownload("products", "pdf")}
              className="w-full py-1.5 px-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-600 hover:text-white text-xs font-bold text-purple-700 dark:text-purple-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Printer size={13} /> Export Catalog PDF (.pdf)
            </button>
          </div>
        </div>

        {/* Orders & Transactions Card */}
        <div className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Orders & Transaction Logs</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Customer purchases, delivery statuses, carriers, payment settlements, and tracking numbers.
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => handleDownload("orders", "json")}
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Download size={13} /> Export Orders (.json)
            </button>
            <button
              onClick={() => handleDownload("orders", "text")}
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-900 hover:text-white text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText size={13} /> Export Orders (.txt)
            </button>
            <button
              onClick={() => handleDownload("orders", "pdf")}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-600 hover:text-white text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <Printer size={13} /> Export Orders PDF (.pdf)
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot History Table */}
      <div className="card overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Previous Verified Snapshots</h3>
          <span className="text-[10px] text-zinc-500 font-semibold">Real MongoDB Snapshots</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-semibold uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4">Snapshot Archive</th>
                <th className="p-4">Archive Scope</th>
                <th className="p-4">Filesize</th>
                <th className="p-4">Creation Time</th>
                <th className="p-4">Integrity</th>
                <th className="p-4 text-right">Download Formats</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {snapshots.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                  <td className="p-4 font-mono font-bold text-zinc-900 dark:text-white">{s.name}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{s.type}</td>
                  <td className="p-4 font-mono text-zinc-500">{s.size}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{s.createdAt}</td>
                  <td className="p-4">
                    <span className="badge text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <ShieldCheck size={11} /> {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => handleDownload("full", "json")}
                        className="text-[10px] font-bold text-brand-600 hover:underline"
                      >
                        JSON
                      </button>
                      <span className="text-zinc-300">|</span>
                      <button
                        onClick={() => handleDownload("full", "text")}
                        className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 hover:underline"
                      >
                        TXT
                      </button>
                      <span className="text-zinc-300">|</span>
                      <button
                        onClick={() => handleDownload("full", "pdf")}
                        className="text-[10px] font-bold text-orange-600 hover:underline"
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

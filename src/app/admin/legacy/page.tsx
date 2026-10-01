"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Image as ImageIcon,
  Activity,
  FileText,
  Settings,
  Database,
  BarChart3,
  Video,
  FileCode,
  Zap,
  RotateCcw,
  Maximize2,
  ExternalLink,
  RefreshCw,
  Mail,
  ShieldAlert,
} from "lucide-react"

const LEGACY_TOOLS = [
  {
    id: "banners",
    name: "Banners CMS",
    desc: "Hero Sliders & Promotional Graphics",
    file: "banners.html",
    icon: ImageIcon,
    badge: "Most Used",
  },
  {
    id: "analytics",
    name: "Legacy Analytics",
    desc: "Sales Trend & Order Pipeline Visuals",
    file: "analytics.html",
    icon: BarChart3,
  },
  {
    id: "activity-log",
    name: "Activity Logs",
    desc: "Live Admin Actions & Event History",
    file: "activity-log.html",
    icon: Activity,
  },
  {
    id: "invoices",
    name: "Customer Invoices",
    desc: "Print & Generate Official Tax Invoices",
    file: "invoices.html",
    icon: FileText,
  },
  {
    id: "cms",
    name: "CMS Pages",
    desc: "Manage About, Terms, & Content Pages",
    file: "cms.html",
    icon: FileCode,
  },
  {
    id: "media",
    name: "Media & Assets",
    desc: "Image library & Product Visuals",
    file: "media.html",
    icon: ImageIcon,
  },
  {
    id: "videos",
    name: "Video Showcase",
    desc: "Manage Product & Athlete Videos",
    file: "videos.html",
    icon: Video,
  },
  {
    id: "flash-sales",
    name: "Flash Sales",
    desc: "Countdown Deals & Timed Promotions",
    file: "flash-sales.html",
    icon: Zap,
  },
  {
    id: "returns",
    name: "Returns Management",
    desc: "Product Return Requests & Inspections",
    file: "returns.html",
    icon: RotateCcw,
  },
  {
    id: "settings",
    name: "Store Settings",
    desc: "Store Metadata, Currency & Tax Rates",
    file: "settings.html",
    icon: Settings,
  },
  {
    id: "backup",
    name: "Database Backup",
    desc: "Export & Snapshot Database",
    file: "backup.html",
    icon: Database,
  },
  {
    id: "email",
    name: "Email Broadcast",
    desc: "Newsletter & Customer Communication",
    file: "email.html",
    icon: Mail,
  },
]

function LegacyAdminContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialToolId = searchParams.get("tool") || "banners"
  const [selectedToolId, setSelectedToolId] = useState(initialToolId)
  const [iframeKey, setIframeKey] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

  const activeTool = LEGACY_TOOLS.find((t) => t.id === selectedToolId) || LEGACY_TOOLS[0]
  const legacyUrl = `http://localhost:5000/admin/${activeTool.file}`

  useEffect(() => {
    // Check if backend on port 5000 is reachable
    fetch("http://localhost:5000/api/health")
      .then((res) => res.json())
      .then((data) => setBackendOnline(data.success === true))
      .catch(() => setBackendOnline(false))
  }, [])

  const handleSelectTool = (id: string) => {
    setSelectedToolId(id)
    router.push(`/admin/legacy?tool=${id}`)
    setIframeKey((k) => k + 1)
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? "fixed inset-0 z-50 bg-zinc-950 p-4 overflow-hidden" : ""}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
              Merged Legacy Admin Suite
            </h1>
            <span className="badge bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold py-0.5 px-2">
              Integrated in Modern Panel
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Full access to legacy features: Banners CMS, Invoices, Activity Logs, and Store Settings without leaving your Next.js dashboard.
          </p>
        </div>

        {/* Backend Status indicator & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline === true
                  ? "bg-emerald-500 animate-pulse"
                  : backendOnline === false
                  ? "bg-rose-500"
                  : "bg-amber-500 animate-pulse"
              }`}
            />
            <span className="text-zinc-600 dark:text-zinc-300">
              {backendOnline === true
                ? "Legacy Backend: Online (Port 5000)"
                : backendOnline === false
                ? "Legacy Backend: Reconnecting..."
                : "Checking backend..."}
            </span>
          </div>

          <a
            href={legacyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Open standalone legacy page in a new browser tab"
          >
            <ExternalLink size={13} />
            <span>Open Standalone ↗</span>
          </a>

          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title="Reload Tool"
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-200 dark:border-zinc-800">
        {LEGACY_TOOLS.map((tool) => {
          const Icon = tool.icon
          const isSelected = tool.id === selectedToolId
          return (
            <button
              key={tool.id}
              onClick={() => handleSelectTool(tool.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                  : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-amber-500/50"
              }`}
            >
              <Icon size={14} className={isSelected ? "text-white" : "text-zinc-400"} />
              <span>{tool.name}</span>
              {tool.badge && !isSelected && (
                <span className="text-[9px] px-1 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded font-semibold">
                  {tool.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Main Tool Embedded Frame */}
      <div className="card overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl flex flex-col">
        {/* Frame Sub-header */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <activeTool.icon size={14} className="text-amber-500" />
              {activeTool.name}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-400">{activeTool.desc}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-zinc-400">
              http://localhost:5000/admin/{activeTool.file}
            </span>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div className="relative w-full" style={{ height: isFullscreen ? "calc(100vh - 120px)" : "750px" }}>
          <iframe
            key={iframeKey}
            src={legacyUrl}
            title={activeTool.name}
            className="w-full h-full border-none bg-white"
            allow="fullscreen; clipboard-read; clipboard-write"
          />
        </div>
      </div>
    </div>
  )
}

export default function LegacyAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-zinc-400">
          Loading Legacy Admin Suite...
        </div>
      }
    >
      <LegacyAdminContent />
    </Suspense>
  )
}

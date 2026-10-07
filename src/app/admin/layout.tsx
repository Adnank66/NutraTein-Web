import Link from "next/link"
import { auth } from "@/lib/auth"
import AdminSidebar from "@/components/admin/AdminSidebar"
import AdminDirectLogin from "@/components/admin/AdminDirectLogin"
import AdminReloadGuard from "@/components/admin/AdminReloadGuard"
import ThemeToggle from "@/components/layout/ThemeToggle"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Guard admin routes: Render Direct Admin Authentication form directly on /admin
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return <AdminDirectLogin />
  }

  const adminName = session.user?.name || "Admin"
  const adminEmail = session.user?.email || "admin@proteinx.in"
  const adminRole = (session.user as any)?.role || "ADMIN"

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col lg:flex-row relative">
      <AdminReloadGuard />
      {/* Self-contained Client Component Sidebar */}
      <AdminSidebar
        adminName={adminName}
        adminEmail={adminEmail}
        adminRole={adminRole}
      />

      {/* Main Admin Area with margin matching the fixed sidebar width */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 min-h-screen lg:ml-72 xl:ml-80 min-w-0">
        {/* Top Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">{adminEmail}</span>
            <span>•</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">Super Administrator</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-brand-600 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors"
            >
              🏪 Storefront ↗
            </Link>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
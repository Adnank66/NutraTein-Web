"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Zap,
  ArrowLeft,
  QrCode,
  BarChart3,
  Globe,
  Bell,
  Store,
  FileText,
  PhoneCall,
  LogOut,
  ChevronDown,
  Sparkles,
  Image as ImageIcon,
  Activity,
  Settings,
  Megaphone,
  Star,
  RotateCcw,
  Truck,
  Layers,
  Film,
  Mail,
  Database,
  HelpCircle,
  Shield,
} from "lucide-react"
import { useState } from "react"
import AdminThemeControls from "@/components/admin/AdminThemeControls"

interface AdminSidebarProps {
  adminName: string
  adminEmail: string
  adminRole: string
}

const navGroups = [
  {
    label: "Analytics & Overview",
    items: [
      { label: "Dashboard Overview", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Sales Analytics & Charts", href: "/admin/analytics", icon: BarChart3, exact: false },
    ],
  },
  {
    label: "Orders & Fulfillment",
    items: [
      { label: "Live Orders & Dispatch", href: "/admin/orders", icon: ShoppingCart, exact: false },
      { label: "Returns & Refunds", href: "/admin/returns", icon: RotateCcw, exact: false },
      { label: "Tax Invoices & Billing", href: "/admin/invoices", icon: FileText, exact: false },
      { label: "Shipping & Courier AWB", href: "/admin/shipping", icon: Truck, exact: false },
      { label: "Customers Directory", href: "/admin/customers", icon: Users, exact: false },
    ],
  },
  {
    label: "Catalog & Media",
    items: [
      { label: "Products & Live Stock", href: "/admin/products", icon: Package, exact: false },
      { label: "Categories Manager", href: "/admin/categories", icon: Layers, exact: false },
      { label: "Customer Reviews Control", href: "/admin/reviews", icon: Star, exact: false },
      { label: "FAQ Manager", href: "/admin/faq", icon: HelpCircle, exact: false },
      { label: "Media Assets Library", href: "/admin/media", icon: ImageIcon, exact: false },
    ],
  },
  {
    label: "Marketing & Creative CMS",
    items: [
      { label: "Discount Promo Coupons", href: "/admin/coupons", icon: Tag, exact: false },
      { label: "Hero Banners CMS", href: "/admin/banners", icon: Layers, exact: false },
      { label: "Combo Stacks CMS", href: "/admin/combos", icon: Layers, exact: false },
      { label: "Athlete Video Showcase", href: "/admin/videos", icon: Film, exact: false },
      { label: "Free Shipping & Announcements", href: "/admin/announcements", icon: Megaphone, exact: false },
    ],
  },
  {
    label: "System & Governance",
    items: [
      { label: "Email & Stock Alerts", href: "/admin/email-settings", icon: Mail, exact: false },
      { label: "Staff & Team Roles", href: "/admin/staff", icon: Users, exact: false },
      { label: "Database Backups & Export", href: "/admin/backups", icon: Database, exact: false },
      { label: "Store Settings & Legal", href: "/admin/settings", icon: Settings, exact: false },
      { label: "UPI & QR Payouts", href: "/admin/payment-settings", icon: QrCode, exact: false },
      { label: "Activity Audit Logs", href: "/admin/activity-log", icon: Activity, exact: false },
      { label: "Login History", href: "/admin/login-history", icon: Shield, exact: false },
      { label: "Social Media Links", href: "/admin/social", icon: Globe, exact: false },
    ],
  },
]

export default function AdminSidebar({ adminName, adminEmail, adminRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href.split("?")[0])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <Link href="/admin" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30 transition-transform group-hover:scale-105">
              <span className="font-black text-sm text-white italic">N</span>
            </div>
            <span className="font-display text-base font-black tracking-tight text-white uppercase">
              NUTRA<span className="text-brand-500"> TEIN</span>
            </span>
          </Link>
          <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 bg-purple-900/80 border border-purple-700 text-purple-300 rounded-md">
            ADMIN
          </span>
        </div>

        {/* Admin Info */}
        <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <p className="text-xs font-bold text-white truncate">{adminName}</p>
          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{adminEmail}</p>
          <span className="inline-block mt-1.5 text-[9px] font-bold bg-purple-800/60 text-purple-300 px-1.5 py-0.5 rounded-md border border-purple-700/50">
            {adminRole === "ADMIN" ? "Super Administrator" : adminRole}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 px-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon, external, exact }: any) =>
                external ? (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors group"
                  >
                    <Icon size={14} className="text-zinc-500 group-hover:text-amber-400 transition-colors shrink-0" />
                    <span className="truncate flex-1">{label}</span>
                    <Globe size={10} className="text-zinc-600 shrink-0" />
                  </a>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors group",
                      isActive(href, exact ?? false)
                        ? "bg-brand-600/20 text-brand-400 border border-brand-600/30"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    )}
                  >
                    <Icon
                      size={14}
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive(href, exact ?? false)
                          ? "text-brand-500"
                          : "text-zinc-500 group-hover:text-zinc-300"
                      )}
                    />
                    <span className="truncate flex-1">{label}</span>
                    {isActive(href, exact ?? false) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                    )}
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="px-3 pb-4 pt-3 border-t border-zinc-800/80 space-y-1 shrink-0">
        <div className="px-2 py-1 mb-1 flex items-center justify-between">
          <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Theme</span>
          <AdminThemeControls compact />
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors w-full"
        >
          <Store size={13} className="shrink-0" />
          <span>View Live Store ↗</span>
        </a>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-950/40 transition-colors w-full text-left"
        >
          <LogOut size={13} className="shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 xl:w-80 bg-zinc-950 text-white flex-col shrink-0 fixed left-0 top-0 h-screen overflow-hidden border-r border-zinc-800 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <span className="font-display text-base font-bold text-white">
            PROTEIN<span className="text-brand-500">X</span>
            <span className="text-[10px] font-bold text-purple-400 ml-1">ADMIN</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <ChevronDown size={16} className={cn("transition-transform", mobileOpen && "rotate-180")} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-30 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed top-[52px] left-0 right-0 z-40 bg-zinc-950 border-b border-zinc-800 max-h-[80vh] overflow-y-auto shadow-2xl">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  )
}


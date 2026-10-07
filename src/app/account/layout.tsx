import StoreLayout from "@/components/layout/StoreLayout"
import Link from "next/link"
import { User, Package, Heart, MapPin, Settings, LayoutDashboard, RefreshCw, Gift } from "lucide-react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) {
    redirect("/auth/login")
  }

  const navItems = [
    { label: "Dashboard", href: "/account", icon: User },
    { label: "My Orders", href: "/account/orders", icon: Package },
    { label: "My Subscriptions", href: "/account/subscriptions", icon: RefreshCw },
    { label: "My Rewards", href: "/account/rewards", icon: Gift },
    { label: "Wishlist", href: "/account/wishlist", icon: Heart },
    { label: "Saved Addresses", href: "/account/addresses", icon: MapPin },
    { label: "Settings", href: "/account/settings", icon: Settings },
  ]

  return (
    <StoreLayout>
      <div className="py-10 bg-dark-50/50 min-h-[75vh]">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card p-5 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-dark-100">
                  <div className="w-12 h-12 rounded-full bg-brand-500 text-white font-bold text-lg flex items-center justify-center">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-dark-900 truncate">{session.user?.name || "Customer"}</p>
                    <p className="text-xs text-dark-400 truncate">{session.user?.email}</p>
                  </div>
                </div>

                <nav className="space-y-1">
                  {navItems.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-dark-700 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <Icon size={16} className="text-dark-400" />
                      <span>{label}</span>
                    </Link>
                  ))}

                  {(session.user as any)?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors mt-2"
                    >
                      <LayoutDashboard size={16} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              {children}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}
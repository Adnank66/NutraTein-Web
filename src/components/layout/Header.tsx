"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  ShoppingCart, Heart, Search, User, Menu, X, ChevronDown,
  Package, LogOut, Settings, LayoutDashboard, Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { useWishlistStore } from "@/store/wishlist"
import CartDrawer from "@/components/cart/CartDrawer"
import SmartSearchModal from "@/components/search/SmartSearchModal"
import ThemeToggle from "@/components/layout/ThemeToggle"
import LanguageSwitcher from "@/components/layout/LanguageSwitcher"
import StorefrontAnnouncementBar from "@/components/layout/StorefrontAnnouncementBar"
import NotificationsDropdown from "@/components/layout/NotificationsDropdown"
import { useTranslation } from "@/hooks/useTranslation"



const DEFAULT_PRODUCT_CATS = [
  { label: "Whey", href: "/shop?category=whey-protein" },
  { label: "Mass Gainer", href: "/shop?category=mass-gainer" },
  { label: "Creatine", href: "/shop?category=creatine" },
  { label: "Vitamin", href: "/shop?category=vitamins" },
  { label: "Health", href: "/shop?category=health" },
  { label: "Creatine Accessories", href: "/shop?category=accessories" },
]

const DEFAULT_GOAL_CATS = [
  { label: "Muscle Building", href: "/shop?category=muscle-building" },
  { label: "Strength", href: "/shop?category=strength" },
  { label: "Energy", href: "/shop?category=energy" },
  { label: "Recovery", href: "/shop?category=recovery" },
  { label: "Endurance", href: "/shop?category=endurance" },
]

export default function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({})
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  // Scroll-hide / scroll-show state
  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(false)
  const lastScrollY = useRef(0)

  const cartCount = useCartStore((s) => s.getTotalItems())
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const openCart = useCartStore((s) => s.openCart)
  const { t } = useTranslation()

  const [productOptions, setProductOptions] = useState<any[]>(DEFAULT_PRODUCT_CATS)
  const [goalOptions, setGoalOptions] = useState<any[]>(DEFAULT_GOAL_CATS)

  useEffect(() => {
    setMounted(true)
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.categories && data.categories.length > 0) {
          const apiProductCats = data.categories
            .filter((c: any) => c.type !== 'GOAL')
            .map((c: any) => ({ label: c.name, href: `/shop?category=${c.slug}` }))
          const apiGoalCats = data.categories
            .filter((c: any) => c.type === 'GOAL')
            .map((c: any) => ({ label: c.name, href: `/shop?category=${c.slug}` }))

          // Merge without duplicate labels
          setProductOptions(prev => {
            const map = new Map<string, any>()
            DEFAULT_PRODUCT_CATS.forEach(item => map.set(item.label.toLowerCase(), item))
            apiProductCats.forEach((item: any) => map.set(item.label.toLowerCase(), item))
            return Array.from(map.values())
          })

          setGoalOptions(prev => {
            const map = new Map<string, any>()
            DEFAULT_GOAL_CATS.forEach(item => map.set(item.label.toLowerCase(), item))
            apiGoalCats.forEach((item: any) => map.set(item.label.toLowerCase(), item))
            return Array.from(map.values())
          })
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setScrolled(y > 15)
      // Hide on scroll-down (>80px from top), show on scroll-up
      if (y < 80) {
        setVisible(true)
      } else if (y > lastScrollY.current + 6) {
        setVisible(false)
        setMobileOpen(false)
      } else if (y < lastScrollY.current - 4) {
        setVisible(true)
      }
      lastScrollY.current = y
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
    setActiveDropdown(null)
  }, [pathname])

  return (
    <>
      <StorefrontAnnouncementBar />
      <header
        className={cn(
          "sticky top-0 z-40 backdrop-blur-xl transition-all duration-500 ease-in-out border-b",
          scrolled 
            ? "bg-white/80 dark:bg-zinc-950/80 border-brand-500/20 shadow-[0_8px_30px_rgb(234,88,12,0.1)] py-1.5" 
            : "bg-white/95 dark:bg-zinc-950/95 border-zinc-100 dark:border-zinc-800/80 py-3",
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-7 h-7 rounded-lg bg-zinc-950 dark:bg-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
                <span className="font-black text-sm text-brand-600 dark:text-zinc-950 italic">N</span>
              </div>
              <span className="font-display text-lg font-black tracking-tight text-zinc-950 dark:text-white uppercase">
                NUTRA<span className="text-brand-600"> TEIN</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {/* 1. Home */}
              <Link
                href="/"
                className={cn(
                  "px-3 py-2 rounded-lg transition-colors",
                  pathname === "/" ? "text-brand-600 bg-brand-50/70 dark:bg-brand-950/40" : "hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                )}
              >
                Home
              </Link>

              {/* 2. Shop by Product Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("PRODUCT")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "PRODUCT" ? null : "PRODUCT")}
                  className={cn(
                    "px-3 py-2 rounded-lg flex items-center gap-1 transition-colors",
                    pathname.startsWith("/shop") && activeDropdown === "PRODUCT"
                      ? "text-brand-600 bg-brand-50/70 dark:bg-brand-950/40"
                      : "hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  )}
                >
                  <span>Shop by Product</span>
                  <ChevronDown size={13} className={cn("text-zinc-400 transition-transform duration-200", activeDropdown === "PRODUCT" && "rotate-180")} />
                </button>

                {activeDropdown === "PRODUCT" && (
                  <div className="absolute top-full left-0 pt-2 w-56 animate-scale-in z-50">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 space-y-1">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                        Products
                      </div>
                      {productOptions.map((opt, idx) => (
                        <Link
                          key={`prod-${idx}`}
                          href={opt.href}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                        >
                          {opt.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Shop by Goal Dropdown */}
              <div
                className="relative group"
                onMouseEnter={() => setActiveDropdown("GOAL")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "GOAL" ? null : "GOAL")}
                  className={cn(
                    "px-3 py-2 rounded-lg flex items-center gap-1 transition-colors",
                    pathname.startsWith("/shop") && activeDropdown === "GOAL"
                      ? "text-brand-600 bg-brand-50/70 dark:bg-brand-950/40"
                      : "hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  )}
                >
                  <span>Shop by Goal</span>
                  <ChevronDown size={13} className={cn("text-zinc-400 transition-transform duration-200", activeDropdown === "GOAL" && "rotate-180")} />
                </button>

                {activeDropdown === "GOAL" && (
                  <div className="absolute top-full left-0 pt-2 w-56 animate-scale-in z-50">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 space-y-1">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                        Fitness Goals
                      </div>
                      {goalOptions.map((opt, idx) => (
                        <Link
                          key={`goal-${idx}`}
                          href={opt.href}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                        >
                          {opt.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Deals, About, Contact, Write Review */}
              {[
                { label: "Deals", href: "/deals" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Write Review", href: "/write-review" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-lg transition-colors",
                    pathname === item.href
                      ? "text-brand-600 bg-brand-50/70 dark:bg-brand-950/40"
                      : "hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="btn-ghost p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              <button
                onClick={openCart}
                className="btn-ghost p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white relative"
                aria-label="Cart"
              >
                <ShoppingCart size={18} />
                {mounted && cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>

              {session ? (
                <>
                  <Link
                    href="/account/wishlist"
                    className="btn-ghost p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white relative hidden sm:flex"
                    aria-label="Wishlist"
                  >
                    <Heart size={18} />
                    {mounted && wishlistCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
                        {wishlistCount > 9 ? "9+" : wishlistCount}
                      </span>
                    )}
                  </Link>

                  <div className="hidden sm:block">
                    <NotificationsDropdown />
                  </div>

                  <div className="hidden sm:block">
                    <LanguageSwitcher />
                  </div>
                  
                  <ThemeToggle />

                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center">
                        {session.user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 z-30 animate-scale-in">
                          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{session.user?.name}</p>
                            <p className="text-[11px] text-zinc-400 truncate">{session.user?.email}</p>
                          </div>
                          {(session.user as any)?.role === "ADMIN" && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl mb-1"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <LayoutDashboard size={14} /> Admin Dashboard
                            </Link>
                          )}
                          <Link
                            href="/account"
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User size={14} /> Dashboard
                          </Link>
                          <Link
                            href="/account/orders"
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Package size={14} /> My Orders
                          </Link>
                          
                          {/* Show these in dropdown ONLY on mobile */}
                          <div className="sm:hidden border-t border-zinc-100 dark:border-zinc-800 my-1 pt-1">
                            <Link
                              href="/account/wishlist"
                              className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <span className="flex items-center gap-2"><Heart size={14} /> Wishlist</span>
                              {mounted && wishlistCount > 0 && (
                                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                                  {wishlistCount}
                                </span>
                              )}
                            </Link>
                            <div className="w-full">
                              <NotificationsDropdown showLabel label="Updates" />
                            </div>
                            <div className="px-2 py-1">
                              <LanguageSwitcher />
                            </div>
                          </div>

                          <Link
                            href="/account/settings"
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings size={14} /> Settings
                          </Link>
                          <button
                            onClick={() => { signOut(); setUserMenuOpen(false) }}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl w-full text-left mt-1"
                          >
                            <LogOut size={14} /> Sign Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <LanguageSwitcher />
                  <ThemeToggle />
                  <Link
                    href="/login"
                    className="btn-secondary py-1.5 px-3 text-xs font-semibold"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="btn-ghost p-2 lg:hidden text-zinc-800 dark:text-zinc-200"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav — slide-down animation */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 animate-slide-down">
            <div className="container-custom py-4 space-y-1">
              {/* Home */}
              <Link
                href="/"
                className={cn(
                  "block px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                  pathname === "/" ? "text-brand-600 bg-brand-50 dark:bg-brand-950/40" : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                )}
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>

              {/* Shop by Product Accordion */}
              <div className="rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800/80 mb-1">
                <button
                  type="button"
                  onClick={() => setMobileExpanded(p => ({ ...p, product: !p.product }))}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/50"
                >
                  <span>Shop by Product</span>
                  <ChevronDown size={14} className={cn("text-zinc-400 transition-transform duration-200", mobileExpanded.product && "rotate-180")} />
                </button>
                {mobileExpanded.product && (
                  <div className="p-2 space-y-0.5 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
                    {productOptions.map((opt, idx) => (
                      <Link
                        key={`m-prod-${idx}`}
                        href={opt.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        {opt.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Shop by Goal Accordion */}
              <div className="rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800/80 mb-1">
                <button
                  type="button"
                  onClick={() => setMobileExpanded(p => ({ ...p, goal: !p.goal }))}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/50"
                >
                  <span>Shop by Goal</span>
                  <ChevronDown size={14} className={cn("text-zinc-400 transition-transform duration-200", mobileExpanded.goal && "rotate-180")} />
                </button>
                {mobileExpanded.goal && (
                  <div className="p-2 space-y-0.5 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
                    {goalOptions.map((opt, idx) => (
                      <Link
                        key={`m-goal-${idx}`}
                        href={opt.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        {opt.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Other standard nav links */}
              {[
                { label: "Deals", href: "/deals" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Write Review", href: "/write-review" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                    pathname === item.href
                      ? "text-brand-600 bg-brand-50 dark:bg-brand-950/40"
                      : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {!session && (
                <div className="pt-3 flex gap-2 border-t border-zinc-100 dark:border-zinc-800">
                  <Link href="/login" className="btn-secondary flex-1 text-xs justify-center" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-primary flex-1 text-xs justify-center" onClick={() => setMobileOpen(false)}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <CartDrawer />
      <SmartSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
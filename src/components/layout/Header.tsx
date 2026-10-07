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

const baseNavLinks = [
  { key: "nav.home", label: "Home", href: "/" },
  // Category link will be injected here dynamically
  { key: "nav.deals", label: "Deals", href: "/deals" },
  { key: "nav.about", label: "About", href: "/about" },
  { key: "nav.contact", label: "Contact", href: "/contact" },
  { label: "Write Review", href: "/write-review" },
]

export default function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeNavTab, setActiveNavTab] = useState<"PRODUCT" | "GOAL">("PRODUCT")
  // Scroll-hide / scroll-show state
  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(false)
  const lastScrollY = useRef(0)

  const cartCount = useCartStore((s) => s.getTotalItems())
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const openCart = useCartStore((s) => s.openCart)
  const { t } = useTranslation()

  const [navLinks, setNavLinks] = useState<any[]>(baseNavLinks)

  useEffect(() => {
    setMounted(true)
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.categories) {
          const productCats = data.categories.filter((c: any) => c.type !== 'GOAL')
          const goalCats = data.categories.filter((c: any) => c.type === 'GOAL')
          
          const categoriesLink = {
            key: "nav.categories",
            label: "Shop",
            href: "/shop",
            isMegaMenu: true,
            goalCats: goalCats.map((c: any) => ({ label: c.name, href: `/shop?category=${c.slug}` })),
            productCats: productCats.map((c: any) => ({ label: c.name, href: `/shop?category=${c.slug}` }))
          }
          
          setNavLinks([
            baseNavLinks[0],
            categoriesLink,
            ...baseNavLinks.slice(1)
          ])
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
    setDropdownOpen(false)
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
              {navLinks.map((link) => {
                const label = (mounted && link.key) ? t(link.key) || link.label : link.label
                return (
                  <div key={link.label} className="relative group">
                    {link.isMegaMenu || link.children ? (
                      <div
                        onMouseEnter={() => setDropdownOpen(true)}
                        onMouseLeave={() => setDropdownOpen(false)}
                        className="relative"
                      >
                        <Link
                          href={link.href}
                          className={cn(
                            "px-3 py-2 rounded-lg flex items-center gap-1 transition-colors relative",
                            pathname.startsWith("/shop")
                              ? "text-brand-600 bg-brand-50/70 dark:bg-brand-950/40"
                              : "hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          )}
                        >
                          {label}
                          <ChevronDown size={13} className="text-zinc-400 group-hover:rotate-180 transition-transform duration-200" />
                        </Link>

                        {dropdownOpen && link.isMegaMenu && (
                          <div className="absolute top-full left-0 pt-2 w-64 animate-scale-in">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                              <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                                <button
                                  className={cn("flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors", activeNavTab === "PRODUCT" ? "bg-brand-50 dark:bg-brand-950/40 text-brand-600" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50")}
                                  onClick={() => setActiveNavTab("PRODUCT")}
                                >
                                  Shop by Product
                                </button>
                                <button
                                  className={cn("flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors border-l border-zinc-100 dark:border-zinc-800", activeNavTab === "GOAL" ? "bg-brand-50 dark:bg-brand-950/40 text-brand-600" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50")}
                                  onClick={() => setActiveNavTab("GOAL")}
                                >
                                  Shop by Goal
                                </button>
                              </div>
                              <div className="p-2 space-y-0.5">
                                {(activeNavTab === "PRODUCT" ? link.productCats : link.goalCats).map((child: any, idx: number) => (
                                  <Link
                                    key={`${child.href}-${idx}`}
                                    href={child.href}
                                    onClick={() => setDropdownOpen(false)}
                                    className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {dropdownOpen && link.children && (
                          <div className="absolute top-full left-0 pt-2 w-52 animate-scale-in">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 space-y-0.5">
                              {link.children.map((child: any, idx: number) => {
                                const childLabel = (mounted && child.key) ? t(child.key) || child.label : child.label
                                if (child.isHeader) {
                                  return (
                                    <div key={`header-${idx}`} className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                                      {childLabel}
                                    </div>
                                  )
                                }
                                return (
                                  <Link
                                    key={`${child.href}-${idx}`}
                                    href={child.href}
                                    onClick={() => setDropdownOpen(false)}
                                    className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                                  >
                                    {childLabel}
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        className={cn(
                          "px-3 py-2 rounded-lg transition-colors block relative group/link",
                          pathname === link.href
                            ? "text-brand-600 bg-brand-50/70 dark:bg-brand-950/40 font-bold"
                            : "hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        )}
                      >
                        {label}
                        {/* Animated underline */}
                        {pathname !== link.href && (
                          <span className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-brand-500 rounded-full scale-x-0 group-hover/link:scale-x-100 transition-transform duration-200 origin-left" />
                        )}
                      </Link>
                    )}
                  </div>
                )
              })}
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
              {navLinks.map((link) => (
                <div key={link.label}>
                  <Link
                    href={link.href}
                    className={cn(
                      "block px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                      pathname === link.href
                        ? "text-brand-600 bg-brand-50 dark:bg-brand-950/40"
                        : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-brand-600 dark:hover:text-brand-400"
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {mounted && link.key ? t(link.key) || link.label : link.label}
                  </Link>

                  {link.isMegaMenu && (
                    <div className="pl-4 border-l border-zinc-100 dark:border-zinc-800 ml-3 mt-1 mb-2">
                      <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden mb-2 w-full max-w-[240px]">
                        <button
                          className={cn("flex-1 py-1.5 text-[10px] font-bold uppercase", activeNavTab === "PRODUCT" ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600" : "text-zinc-500")}
                          onClick={() => setActiveNavTab("PRODUCT")}
                        >
                          Shop by Product
                        </button>
                        <button
                          className={cn("flex-1 py-1.5 text-[10px] font-bold uppercase border-l border-zinc-200 dark:border-zinc-800", activeNavTab === "GOAL" ? "bg-brand-50 dark:bg-brand-900/30 text-brand-600" : "text-zinc-500")}
                          onClick={() => setActiveNavTab("GOAL")}
                        >
                          Shop by Goal
                        </button>
                      </div>
                      <div className="space-y-1">
                        {(activeNavTab === "PRODUCT" ? link.productCats : link.goalCats).map((child: any, idx: number) => (
                          <Link
                            key={`mob-mega-${idx}`}
                            href={child.href}
                            className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {link.children && !link.isMegaMenu && (
                    <div className="pl-4 border-l border-zinc-100 dark:border-zinc-800 ml-3 mt-1 space-y-1">
                      {link.children.map((child: any, idx: number) => {
                        const childLabel = (mounted && child.key) ? t(child.key) || child.label : child.label
                        if (child.isHeader) {
                          return <div key={`mob-head-${idx}`} className="px-3 pt-2 pb-1 text-[10px] font-bold text-zinc-400 uppercase">{childLabel}</div>
                        }
                        return (
                          <Link
                            key={`mob-child-${idx}`}
                            href={child.href}
                            className="block px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            onClick={() => setMobileOpen(false)}
                          >
                            {childLabel}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
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
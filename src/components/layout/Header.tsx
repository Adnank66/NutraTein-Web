"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  ShoppingCart, Heart, Search, User, Menu, X, ChevronDown,
  Package, LogOut, Settings, LayoutDashboard, Zap, Mail, Phone
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { useWishlistStore } from "@/store/wishlist"
import CartDrawer from "@/components/cart/CartDrawer"
import SmartSearchModal from "@/components/search/SmartSearchModal"
import ThemeToggle from "@/components/layout/ThemeToggle"
import StorefrontAnnouncementBar from "@/components/layout/StorefrontAnnouncementBar"
import NotificationsDropdown from "@/components/layout/NotificationsDropdown"
import { useTranslation } from "@/hooks/useTranslation"



const DEFAULT_PRODUCT_CATS = [
  { label: "Whey Protein", href: "/shop?category=whey-protein" },
  { label: "Mass Gainers", href: "/shop?category=mass-gainers" },
  { label: "Creatine", href: "/shop?category=creatine" },
  { label: "Pre-Workout", href: "/shop?category=pre-workout" },
  { label: "Vitamins & Health", href: "/shop?category=vitamins" },
  { label: "Gym Accessories", href: "/shop?category=accessories" },
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
  const userMenuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false)
        setUserMenuOpen(false)
        setActiveDropdown(null)
      }
    }
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

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
            <Link href="/" className="flex items-center shrink-0 group py-1" aria-label="NutraTein Home">
              <Image
                src="/assets/logos/nutratein-logo.png"
                alt="NutraTein"
                width={150}
                height={70}
                className="h-8 sm:h-9 w-auto object-contain dark:invert transition-transform group-hover:scale-105"
                priority
              />
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
                onMouseEnter={() => {
                  setActiveDropdown("PRODUCT")
                  setUserMenuOpen(false)
                }}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(activeDropdown === "PRODUCT" ? null : "PRODUCT")
                    setUserMenuOpen(false)
                  }}
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
                onMouseEnter={() => {
                  setActiveDropdown("GOAL")
                  setUserMenuOpen(false)
                }}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(activeDropdown === "GOAL" ? null : "GOAL")
                    setUserMenuOpen(false)
                  }}
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

              {/* 4. Deals, About */}
              <Link
                href="/deals"
                className={cn(
                  "px-3 py-2 rounded-lg transition-colors",
                  pathname === "/deals"
                    ? "text-brand-600 bg-brand-50/70 dark:bg-brand-950/40"
                    : "hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                )}
              >
                Deals
              </Link>

              <Link
                href="/about"
                className={cn(
                  "px-3 py-2 rounded-lg transition-colors",
                  pathname === "/about"
                    ? "text-brand-600 bg-brand-50/70 dark:bg-brand-950/40"
                    : "hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                )}
              >
                About
              </Link>

              {/* 5. Contact with Support Info Hover Popover */}
              <div
                className="relative group"
                onMouseEnter={() => {
                  setActiveDropdown("CONTACT")
                  setUserMenuOpen(false)
                }}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href="/contact"
                  className={cn(
                    "px-3 py-2 rounded-lg flex items-center gap-1 transition-colors",
                    pathname === "/contact"
                      ? "text-brand-600 bg-brand-50/70 dark:bg-brand-950/40"
                      : "hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  )}
                >
                  <span>Contact</span>
                  <ChevronDown
                    size={13}
                    className={cn(
                      "text-zinc-400 transition-transform duration-200",
                      activeDropdown === "CONTACT" && "rotate-180"
                    )}
                  />
                </Link>

                {activeDropdown === "CONTACT" && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64 animate-scale-in z-50">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-1.5 flex items-center justify-between">
                        <span>Direct Support</span>
                        <span className="text-[9px] text-emerald-600 font-bold">Online</span>
                      </div>
                      <a
                        href="mailto:nutratein@gmail.com"
                        className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                      >
                        <Mail size={14} className="text-brand-500 shrink-0" />
                        <span className="truncate">nutratein@gmail.com</span>
                      </a>
                      <a
                        href="tel:+918779060033"
                        className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                      >
                        <Phone size={14} className="text-brand-500 shrink-0" />
                        <span>+91 877 906 0033</span>
                      </a>
                      <a
                        href="https://wa.me/918779060033"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">W</span>
                        <span>WhatsApp: 877 906 0033</span>
                      </a>
                      <Link
                        href="/contact"
                        onClick={() => setActiveDropdown(null)}
                        className="block text-center text-[11px] font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/50 py-1.5 rounded-xl transition-colors"
                      >
                        Open Contact Page →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Write Review */}
              <Link
                href="/write-review"
                className={cn(
                  "px-3 py-2 rounded-lg transition-colors",
                  pathname === "/write-review"
                    ? "text-brand-600 bg-brand-50/70 dark:bg-brand-950/40"
                    : "hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                )}
              >
                Write Review
              </Link>
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

                  <ThemeToggle />

                  <div ref={userMenuRef} className="relative">
                    <button
                      onClick={() => {
                        const next = !userMenuOpen
                        setUserMenuOpen(next)
                        if (next) {
                          setMobileOpen(false)
                          setActiveDropdown(null)
                        }
                      }}
                      className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      aria-label="User account menu"
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
                          <Link
                            href="/account"
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User size={14} /> My Profile
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
                onClick={() => {
                  const next = !mobileOpen
                  setMobileOpen(next)
                  if (next) {
                    setUserMenuOpen(false)
                    setActiveDropdown(null)
                  }
                }}
                className="btn-ghost p-2 lg:hidden text-zinc-800 dark:text-zinc-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu backdrop for outside click dismiss */}
        {mobileOpen && (
          <div
            className="fixed inset-0 top-[60px] z-30 bg-black/40 backdrop-blur-xs lg:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile nav — slide-down animation */}
        {mobileOpen && (
          <div
            id="mobile-navigation"
            className="lg:hidden relative z-40 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 animate-slide-down max-h-[calc(100vh-80px)] overflow-y-auto"
          >
            <div className="container-custom py-4 space-y-1">
              {/* Home */}
              <Link
                href="/"
                className={cn(
                  "flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors",
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
                  className="w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/50"
                  aria-expanded={!!mobileExpanded.product}
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
                        className="flex items-center min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
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
                  className="w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-50/50 dark:bg-zinc-900/50"
                  aria-expanded={!!mobileExpanded.goal}
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
                        className="flex items-center min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        {opt.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Other standard nav links */}
              {[
                { label: "Deals & Offers", href: "/deals" },
                { label: "Track Your Order", href: "/track" },
                { label: "About Nutratein", href: "/about" },
                { label: "Contact Support", href: "/contact" },
                { label: "Write a Review", href: "/write-review" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                    pathname === item.href
                      ? "text-brand-600 bg-brand-50 dark:bg-brand-950/40"
                      : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* Direct Contact Support Box */}
              <div className="my-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-200/50 dark:border-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Direct Support</span>
                  <span className="text-[9px] text-emerald-600 font-bold">Online</span>
                </div>
                <a
                  href="mailto:nutratein@gmail.com"
                  className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-brand-600 text-xs font-medium py-0.5"
                >
                  <Mail size={13} className="text-brand-500 shrink-0" />
                  <span className="truncate">nutratein@gmail.com</span>
                </a>
                <a
                  href="tel:+918779060033"
                  className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-brand-600 text-xs font-medium py-0.5"
                >
                  <Phone size={13} className="text-brand-500 shrink-0" />
                  <span>+91 877 906 0033</span>
                </a>
                <a
                  href="https://wa.me/918779060033"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 text-xs font-medium py-0.5"
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">W</span>
                  <span>WhatsApp: 877 906 0033</span>
                </a>
              </div>

              {session ? (
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div className="px-3 py-1">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{session.user?.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{session.user?.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="btn-secondary min-h-[44px] text-xs justify-center items-center"
                    >
                      <User size={13} /> My Profile
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setMobileOpen(false)}
                      className="btn-secondary min-h-[44px] text-xs justify-center items-center"
                    >
                      <Package size={13} /> My Orders
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="pt-3 flex gap-2 border-t border-zinc-100 dark:border-zinc-800">
                  <Link href="/login" className="btn-secondary flex-1 min-h-[44px] text-xs justify-center items-center" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-primary flex-1 min-h-[44px] text-xs justify-center items-center" onClick={() => setMobileOpen(false)}>
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
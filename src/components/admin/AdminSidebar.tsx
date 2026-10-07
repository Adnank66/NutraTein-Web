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
  Type,
  RefreshCw,
  Gift,
} from "lucide-react"
import { useState } from "react"

import { useLanguageStore } from "@/store/language"

interface AdminSidebarProps {
  adminName: string
  adminEmail: string
  adminRole: string
}

const ADMIN_TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: {
    "Analytics & Overview": "एनालिटिक्स और अवलोकन",
    "Dashboard Overview": "डैशबोर्ड अवलोकन",
    "Sales Analytics & Charts": "बिक्री एनालिटिक्स और चार्ट",
    "Orders & Fulfillment": "ऑर्डर और पूर्ति",
    "Live Orders & Dispatch": "लाइव ऑर्डर और प्रेषण",
    "Returns & Refunds": "वापसी और रिफंड",
    "Tax Invoices & Billing": "टैक्स इनवॉइस और बिलिंग",
    "Shipping & Courier AWB": "शिपिंग और कूरियर AWB",
    "Customers Directory": "ग्राहक निर्देशिका",
    "Catalog & Media": "कैटलॉग और मीडिया",
    "Products & Live Stock": "उत्पाद और लाइव स्टॉक",
    "Categories Manager": "श्रेणी प्रबंधक",
    "Customer Reviews Control": "ग्राहक समीक्षा नियंत्रण",
    "FAQ Manager": "FAQ प्रबंधक",
    "Media Assets Library": "मीडिया एसेट लाइब्रेरी",
    "Marketing & Creative CMS": "मार्केटिंग और क्रिएटिव CMS",
    "Discount Promo Coupons": "डिस्काउंट प्रोमो कूपन",
    "Hero Banners CMS": "हीरो बैनर CMS",
    "Combo Stacks CMS": "कॉम्बो स्टैक्स CMS",
    "Athlete Video Showcase": "एथलीट वीडियो शोकेस",
    "Free Shipping & Announcements": "मुफ़्त शिपिंग और घोषणाएं",
    "System & Governance": "सिस्टम और गवर्नेंस",
    "Email & Stock Alerts": "ईमेल और स्टॉक अलर्ट",
    "Staff & Team Roles": "स्टाफ और टीम भूमिकाएं",
    "Database Backups & Export": "डेटाबेस बैकअप और एक्सपोर्ट",
    "Store Settings & Legal": "स्टोर सेटिंग्स और लीगल",
    "UPI & QR Payouts": "UPI और QR पेआउट",
    "Activity Audit Logs": "गतिविधि ऑडिट लॉग",
    "Login History": "लॉगिन इतिहास",
    "Social Media Links": "सोशल मीडिया लिंक",
    "Super Administrator": "सुपर एडमिनिस्ट्रेटर",
    "View Live Store ↗": "लाइव स्टोर देखें ↗",
    "Sign Out": "साइन आउट",
    "ADMIN": "एडमिन",
    "Theme": "थीम",
  },
  mr: {
    "Analytics & Overview": "अ‍ॅनालिटिक्स आणि आढावा",
    "Dashboard Overview": "डॅशबोर्ड आढावा",
    "Sales Analytics & Charts": "विक्री अ‍ॅनालिटिक्स व चार्ट्स",
    "Orders & Fulfillment": "ऑर्डर्स आणि पूर्तता",
    "Live Orders & Dispatch": "थेट ऑर्डर्स आणि पाठवणी",
    "Returns & Refunds": "परतावा आणि रिफंड",
    "Tax Invoices & Billing": "टॅक्स इन्व्हॉइस आणि बिलिंग",
    "Shipping & Courier AWB": "शिपिंग आणि कुरिअर AWB",
    "Customers Directory": "ग्राहक निर्देशिका",
    "Catalog & Media": "कॅटलॉग आणि मीडिया",
    "Products & Live Stock": "उत्पादने आणि थेट स्टॉक",
    "Categories Manager": "श्रेणी व्यवस्थापक",
    "Customer Reviews Control": "ग्राहक पुनरावलोकन नियंत्रण",
    "FAQ Manager": "FAQ व्यवस्थापक",
    "Media Assets Library": "मीडिया अ‍ॅसेट लायब्ररी",
    "Marketing & Creative CMS": "मार्केटिंग आणि क्रिएटिव्ह CMS",
    "Discount Promo Coupons": "सवलत प्रोमो कूपन्स",
    "Hero Banners CMS": "हिरो बॅनर CMS",
    "Combo Stacks CMS": "कॉम्बो स्टॅक्स CMS",
    "Athlete Video Showcase": "अ‍ॅथलीट व्हिडिओ शोकेस",
    "Free Shipping & Announcements": "मोफत शिपिंग आणि घोषणा",
    "System & Governance": "प्रणाली आणि प्रशासन",
    "Email & Stock Alerts": "ईमेल आणि स्टॉक सूचना",
    "Staff & Team Roles": "कर्मचारी आणि भूमिका",
    "Database Backups & Export": "डेटाबेस बॅकअप आणि निर्यात",
    "Store Settings & Legal": "स्टोअर सेटिंग्ज आणि कायदेशीर",
    "UPI & QR Payouts": "UPI आणि QR पेआउट्स",
    "Activity Audit Logs": "कृती ऑडिट नोंदी",
    "Login History": "लॉगिन इतिहास",
    "Social Media Links": "सोशल मीडिया लिंक्स",
    "Super Administrator": "सुपर प्रशासक",
    "View Live Store ↗": "थेट स्टोअर पहा ↗",
    "Sign Out": "साइन आउट",
    "ADMIN": "प्रशासक",
    "Theme": "थीम",
  },
  ta: {
    "Analytics & Overview": "பகுப்பாய்வு & மேலோட்டம்",
    "Dashboard Overview": "டாஷ்போர்டு கண்ணோட்டம்",
    "Sales Analytics & Charts": "விற்பனை பகுப்பாய்வு விளக்கப்படங்கள்",
    "Orders & Fulfillment": "ஆர்டர்கள் & நிறைவேற்றம்",
    "Live Orders & Dispatch": "நேரடி ஆர்டர்கள் & அனுப்புதல்",
    "Returns & Refunds": "திரும்பப் பெறுதல் & பணம் திரும்ப",
    "Tax Invoices & Billing": "வரி விலைப்பட்டியல் & பில்லிங்",
    "Shipping & Courier AWB": "கப்பல் & கூரியர் AWB",
    "Customers Directory": "வாடிக்கையாளர் அடைவு",
    "Catalog & Media": "பட்டியல் & மீடியா",
    "Products & Live Stock": "தயாரிப்புகள் & நேரடி இருப்பு",
    "Categories Manager": "வகைகள் மேலாளர்",
    "Customer Reviews Control": "வாடிக்கையாளர் மதிப்புரைகள்",
    "FAQ Manager": "அடிக்கடி கேட்கப்படும் கேள்விகள்",
    "Media Assets Library": "மீடியா சொத்து நூலகம்",
    "Marketing & Creative CMS": "சந்தைப்படுத்தல் & ஆக்கப்பூர்வ CMS",
    "Discount Promo Coupons": "தள்ளுபடி விளம்பர கூப்பன்கள்",
    "Hero Banners CMS": "ஹீரோ பேனர்கள் CMS",
    "Combo Stacks CMS": "காம்போ ஸ்டாக்ஸ் CMS",
    "Athlete Video Showcase": "விளையாட்டு வீரர் வீடியோ காட்சி",
    "Free Shipping & Announcements": "இலவச ஷிப்பிங் & அறிவிப்புகள்",
    "System & Governance": "கணினி & நிர்வாகம்",
    "Email & Stock Alerts": "மின்னஞ்சல் & இருப்பு எச்சரிக்கைகள்",
    "Staff & Team Roles": "பணியாளர்கள் & குழு பாத்திரங்கள்",
    "Database Backups & Export": "தரவுத்தள காப்பு & ஏற்றுமதி",
    "Store Settings & Legal": "கடை அமைப்புகள் & சட்டபூர்வமானவை",
    "UPI & QR Payouts": "UPI & QR கொடுப்பனவுகள்",
    "Activity Audit Logs": "செயல்பாட்டு தணிக்கை பதிவுகள்",
    "Login History": "உள்நுழைவு வரலாறு",
    "Social Media Links": "சமூக ஊடக இணைப்புகள்",
    "Super Administrator": "முதன்மை நிர்வாகி",
    "View Live Store ↗": "கடையைப் பார்க்கவும் ↗",
    "Sign Out": "வெளியேறு",
    "ADMIN": "நிர்வாகி",
    "Theme": "தீம்",
  }
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
      { label: "Product Bundles", href: "/admin/bundles", icon: Package, exact: false },
      { label: "Customer Reviews Control", href: "/admin/reviews", icon: Star, exact: false },
      { label: "FAQ Manager", href: "/admin/faq", icon: HelpCircle, exact: false },
      { label: "Media Assets Library", href: "/admin/media", icon: ImageIcon, exact: false },
      { label: "Loyalty & Rewards", href: "/admin/loyalty", icon: Gift, exact: false },
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
      { label: "Legal Pages CMS", href: "/admin/legal", icon: FileText, exact: false },
      { label: "Subscriptions", href: "/admin/subscriptions", icon: RefreshCw, exact: false },
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
      { label: "Audit Logs", href: "/admin/audit-log", icon: Shield, exact: false },
      { label: "Login History", href: "/admin/login-history", icon: Shield, exact: false },
      { label: "Social Media Links", href: "/admin/social", icon: Globe, exact: false },
    ],
  },
]

export default function AdminSidebar({ adminName, adminEmail, adminRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const language = useLanguageStore((s) => s.language)

  const tr = (text: string) => {
    if (language && ADMIN_TRANSLATIONS[language] && ADMIN_TRANSLATIONS[language][text]) {
      return ADMIN_TRANSLATIONS[language][text]
    }
    return text
  }

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href.split("?")[0])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-zinc-200 dark:border-zinc-800/80 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <Link href="/admin" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30 transition-transform group-hover:scale-105">
              <span className="font-black text-sm text-white italic">N</span>
            </div>
            <span className="font-display text-base font-black tracking-tight text-zinc-900 dark:text-white uppercase">
              NUTRA<span className="text-brand-600 dark:text-brand-500"> TEIN</span>
            </span>
          </Link>
          <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 bg-purple-100 dark:bg-purple-900/80 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-md">
            {tr("ADMIN")}
          </span>
        </div>

        {/* Admin Info */}
        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{adminName}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{adminEmail}</p>
          <span className="inline-block mt-1.5 text-[9px] font-bold bg-purple-100 dark:bg-purple-800/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-md border border-purple-200 dark:border-purple-700/50">
            {adminRole === "ADMIN" ? tr("Super Administrator") : adminRole}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 px-2">
              {tr(group.label)}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon, external, exact }: any) =>
                external ? (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                  >
                    <Icon size={14} className="text-zinc-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors shrink-0" />
                    <span className="truncate flex-1">{tr(label)}</span>
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
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <Icon
                      size={14}
                      className={cn(
                        "shrink-0 transition-colors",
                        isActive(href, exact ?? false)
                          ? "text-brand-500"
                          : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-300"
                      )}
                    />
                    <span className="truncate flex-1">{tr(label)}</span>
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

      {/* Footer Area */}
      <div className="px-3 pb-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1 shrink-0">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors w-full"
        >
          <Store size={13} className="shrink-0" />
          <span>{tr("View Live Store ↗")}</span>
        </a>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-950/40 transition-colors w-full text-left"
        >
          <LogOut size={13} className="shrink-0" />
          <span>{tr("Sign Out")}</span>
        </button>
      </div>
    </div>
  )
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 xl:w-80 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white flex-col shrink-0 fixed left-0 top-0 h-screen overflow-hidden border-r border-zinc-200 dark:border-zinc-800 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <span className="font-display text-base font-bold text-zinc-900 dark:text-white">
            PROTEIN<span className="text-brand-600 dark:text-brand-500">X</span>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 ml-1">ADMIN</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-950 dark:hover:text-white transition-colors"
        >
          <ChevronDown size={16} className={cn("transition-transform", mobileOpen && "rotate-180")} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-30 bg-zinc-950/20 dark:bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed top-[52px] left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 max-h-[80vh] overflow-y-auto shadow-2xl">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  )
}


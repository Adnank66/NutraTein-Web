import { ShieldCheck, Truck, RotateCcw, Lock, Star, Phone } from "lucide-react"

interface Props {
  variant?: "horizontal" | "grid" | "compact"
  className?: string
}

const badges = [
  { icon: ShieldCheck, label: "Secure Checkout", sub: "256-bit SSL Encrypted", color: "text-emerald-600 dark:text-emerald-400" },
  { icon: Truck, label: "Free Delivery", sub: "On orders above ₹999", color: "text-blue-600 dark:text-blue-400" },
  { icon: RotateCcw, label: "Easy Returns", sub: "7-day return policy", color: "text-purple-600 dark:text-purple-400" },
  { icon: Lock, label: "100% Genuine", sub: "Lab-tested products", color: "text-amber-600 dark:text-amber-400" },
  { icon: Star, label: "Quality Assured", sub: "GMP Certified Facility", color: "text-brand-600 dark:text-brand-400" },
  { icon: Phone, label: "24/7 Support", sub: "Chat, Email & WhatsApp", color: "text-zinc-600 dark:text-zinc-400" },
]

export default function TrustBadges({ variant = "horizontal", className = "" }: Props) {
  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        {badges.slice(0, 4).map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Icon size={13} className={color} />
            <span className="font-medium">{label}</span>
          </div>
        ))}
      </div>
    )
  }

  if (variant === "grid") {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 ${className}`}>
        {badges.map(({ icon: Icon, label, sub, color }) => (
          <div key={label} className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">
            <div className={`w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-white">{label}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default: horizontal strip (used on dark footer & sections)
  return (
    <div className={`flex flex-wrap justify-center gap-6 sm:gap-8 py-4 ${className}`}>
      {badges.map(({ icon: Icon, label, sub, color }) => (
        <div key={label} className="flex flex-col items-center gap-1.5 text-center min-w-[90px] max-w-[140px]">
          <Icon size={24} className={color} />
          <p className="text-xs font-bold text-white tracking-wide">{label}</p>
          <p className="text-[10px] text-zinc-200 font-medium leading-tight">{sub}</p>
        </div>
      ))}
    </div>
  )
}

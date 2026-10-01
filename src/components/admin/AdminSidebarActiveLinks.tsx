"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface Props {
  href: string
  label: string
  icon: React.ElementType
}

export default function AdminSidebarActiveLinks({ href, label, icon: Icon }: Props) {
  const pathname = usePathname()
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors group",
        isActive
          ? "bg-brand-600/20 text-brand-400 border border-brand-600/30"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      )}
    >
      <Icon
        size={14}
        className={cn(
          "shrink-0 transition-colors",
          isActive ? "text-brand-500" : "text-zinc-500 group-hover:text-zinc-300"
        )}
      />
      <span className="truncate">{label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
      )}
    </Link>
  )
}

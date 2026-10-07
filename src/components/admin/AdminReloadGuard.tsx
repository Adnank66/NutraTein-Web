"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function AdminReloadGuard() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== "undefined" && pathname !== "/admin") {
      try {
        const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[]
        if (navEntries.length > 0 && navEntries[0].type === "reload") {
          router.replace("/admin")
        }
      } catch {}
    }
  }, [pathname, router])

  return null
}

"use client"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Scroll to top on every route change and initial load
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])

  return null
}

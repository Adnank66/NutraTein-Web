"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

export default function NutraTeinLoader() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<"loading" | "complete">("loading")

  // Do not run the storefront loading screen on any admin panel pages
  const isAdmin =
    pathname?.startsWith("/admin") ||
    (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"))

  if (isAdmin) {
    return null
  }

  useEffect(() => {
    if (isAdmin) return
    // Simulate loading progress
    const loadingInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 15) + 5
        if (next >= 100) {
          clearInterval(loadingInterval)
          setTimeout(() => {
            setPhase("complete")
            setTimeout(() => setMounted(false), 800) // allow slide-up animation
          }, 300)
          return 100
        }
        return next
      })
    }, 120)

    return () => clearInterval(loadingInterval)
  }, [])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {phase === "loading" && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center overflow-hidden"
          initial={{ y: 0 }}
          exit={{ y: "-100vh" }}
          transition={{ duration: 0.8, ease: [0.87, 0, 0.13, 1] }}
          role="status"
          aria-label="Loading Nutra Tein"
        >
          <div className="relative font-display text-[clamp(4rem,15vw,12rem)] leading-none uppercase tracking-widest font-black">
            <div className="text-transparent" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)" }}>
              NUTRATEIN
            </div>
            <div
              className="absolute top-0 left-0 text-brand-600 transition-all duration-100 ease-linear"
              style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }}
            >
              NUTRATEIN
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

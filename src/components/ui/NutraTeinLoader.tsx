"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export default function NutraTeinLoader() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [isSlidingUp, setIsSlidingUp] = useState(false)

  // Do not run the storefront loading screen on any admin panel pages
  const isAdmin = pathname?.startsWith("/admin")

  useEffect(() => {
    if (isAdmin) {
      setMounted(false)
      return
    }

    // Lock scrolling while loader runs
    document.body.style.overflowY = "hidden"

    let currentProgress = 0
    const loadingInterval = setInterval(() => {
      // Add random increments for a realistic loading feel
      currentProgress += Math.floor(Math.random() * 15) + 5

      if (currentProgress >= 100) {
        currentProgress = 100
        setProgress(100)
        clearInterval(loadingInterval)

        // Pause briefly at 100% before sliding up
        setTimeout(() => {
          setIsSlidingUp(true)
          document.body.style.overflowY = "auto"

          // Cleanup loader from DOM after transition
          setTimeout(() => {
            setMounted(false)
          }, 1200)
        }, 400)
      } else {
        setProgress(currentProgress)
      }
    }, 120)

    return () => {
      clearInterval(loadingInterval)
      document.body.style.overflowY = "auto"
    }
  }, [isAdmin])

  if (isAdmin || !mounted) {
    return null
  }

  return (
    <div
      id="loader"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#ffffff",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "transform 1.2s cubic-bezier(0.87, 0, 0.13, 1)",
        transformOrigin: "top",
        transform: isSlidingUp ? "translateY(-100vh)" : "translateY(0)",
        pointerEvents: isSlidingUp ? "none" : "auto",
      }}
      role="status"
      aria-label="NutraTein loading"
    >
      <div
        style={{
          position: "relative",
          width: "min(78vw, 520px)",
          aspectRatio: "302 / 142",
        }}
      >
        {/* Layer 1: Outline/muted base logo (14% opacity) */}
        <span
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            backgroundImage: 'url("/assets/logos/nutratein-logo.png")',
            backgroundPosition: "center",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            opacity: 0.14,
          }}
          aria-hidden="true"
        />

        {/* Layer 2: Solid logo that fills up from bottom with clip-path */}
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            display: "block",
            width: "100%",
            height: "100%",
            backgroundImage: 'url("/assets/logos/nutratein-logo.png")',
            backgroundPosition: "center",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            clipPath: `inset(${100 - progress}% 0 0 0)`,
            transition: "clip-path 0.1s linear",
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

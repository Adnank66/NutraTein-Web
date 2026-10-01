"use client"

import { useState, useEffect, useRef } from "react"
import { Sun, Moon, Laptop, Sliders, RotateCcw, Eye, Check } from "lucide-react"

type ThemeMode = "light" | "dark" | "system"

interface AccessibilitySettings {
  brightness: number // 80 - 120
  contrast: number // 80 - 130
  highContrast: boolean
}

const DEFAULT_A11Y: AccessibilitySettings = {
  brightness: 100,
  contrast: 100,
  highContrast: false,
}

export default function AdminThemeControls({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemeMode>("dark")
  const [a11y, setA11y] = useState<AccessibilitySettings>(DEFAULT_A11Y)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Initialize from localStorage
  useEffect(() => {
    setMounted(true)
    const storedTheme = (localStorage.getItem("admin_theme_mode") as ThemeMode) || "dark"
    setTheme(storedTheme)
    applyThemeClass(storedTheme)

    try {
      const storedA11y = localStorage.getItem("admin_accessibility")
      if (storedA11y) {
        const parsed = JSON.parse(storedA11y)
        setA11y(parsed)
        applyA11yStyles(parsed)
      }
    } catch {}

    // Listen to OS theme changes if on system
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const current = localStorage.getItem("admin_theme_mode") as ThemeMode
      if (current === "system") {
        applyThemeClass("system")
      }
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Close popover on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  const applyThemeClass = (mode: ThemeMode) => {
    const root = document.documentElement
    if (mode === "dark") {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else if (mode === "light") {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    } else {
      // System
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (systemDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
      localStorage.setItem("theme", systemDark ? "dark" : "light")
    }
  }

  const applyA11yStyles = (settings: AccessibilitySettings) => {
    const mainEl = document.querySelector("main") as HTMLElement | null
    if (!mainEl) return

    let filterStr = `brightness(${settings.brightness}%) contrast(${
      settings.highContrast ? Math.max(settings.contrast, 120) : settings.contrast
    }%)`
    mainEl.style.filter = filterStr
  }

  const handleSelectTheme = (mode: ThemeMode) => {
    setTheme(mode)
    localStorage.setItem("admin_theme_mode", mode)
    applyThemeClass(mode)
  }

  const handleUpdateA11y = (patch: Partial<AccessibilitySettings>) => {
    const updated = { ...a11y, ...patch }
    setA11y(updated)
    localStorage.setItem("admin_accessibility", JSON.stringify(updated))
    applyA11yStyles(updated)
  }

  const handleResetA11y = () => {
    setA11y(DEFAULT_A11Y)
    localStorage.setItem("admin_accessibility", JSON.stringify(DEFAULT_A11Y))
    applyA11yStyles(DEFAULT_A11Y)
  }

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
    )
  }

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={popoverRef}>
      {/* 3-State Theme Mode Selector */}
      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/90 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700/80">
        <button
          onClick={() => handleSelectTheme("light")}
          className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === "light"
              ? "bg-white text-zinc-900 shadow-xs"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
          title="Light Mode"
        >
          <Sun size={14} className={theme === "light" ? "text-amber-500" : ""} />
        </button>

        <button
          onClick={() => handleSelectTheme("dark")}
          className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === "dark"
              ? "bg-zinc-900 dark:bg-zinc-700 text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
          title="Dark Mode"
        >
          <Moon size={14} className={theme === "dark" ? "text-brand-400" : ""} />
        </button>

        <button
          onClick={() => handleSelectTheme("system")}
          className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === "system"
              ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
          title="Match System"
        >
          <Laptop size={14} />
        </button>
      </div>

      {/* Accessibility Controls Button */}
      <button
        onClick={() => setPopoverOpen(!popoverOpen)}
        className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
          popoverOpen || a11y.brightness !== 100 || a11y.contrast !== 100 || a11y.highContrast
            ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30"
            : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        title="Accessibility & Display Filters (Brightness / Contrast)"
      >
        <Sliders size={14} />
        {!compact && <span className="text-[11px] hidden sm:inline">Display</span>}
      </button>

      {/* Accessibility Popover Dropdown */}
      {popoverOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-4 z-50 animate-scale-in text-zinc-900 dark:text-white space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Eye size={15} className="text-brand-600" />
              <h4 className="font-bold text-xs">Display & Accessibility</h4>
            </div>
            <button
              onClick={handleResetA11y}
              className="text-[10px] font-bold text-zinc-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
              title="Reset to 100% defaults"
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>

          {/* Brightness Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-500 dark:text-zinc-400">Brightness</span>
              <span className="font-mono text-zinc-900 dark:text-white">{a11y.brightness}%</span>
            </div>
            <input
              type="range"
              min={80}
              max={120}
              step={5}
              value={a11y.brightness}
              onChange={(e) => handleUpdateA11y({ brightness: Number(e.target.value) })}
              className="w-full accent-brand-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>Dim (80%)</span>
              <span>Normal</span>
              <span>Vivid (120%)</span>
            </div>
          </div>

          {/* Contrast Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-500 dark:text-zinc-400">Contrast</span>
              <span className="font-mono text-zinc-900 dark:text-white">{a11y.contrast}%</span>
            </div>
            <input
              type="range"
              min={80}
              max={130}
              step={5}
              value={a11y.contrast}
              onChange={(e) => handleUpdateA11y({ contrast: Number(e.target.value) })}
              className="w-full accent-brand-600 cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>Soft (80%)</span>
              <span>100%</span>
              <span>Crisp (130%)</span>
            </div>
          </div>

          {/* High Contrast Quick Toggle */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-white">High Contrast Mode</p>
              <p className="text-[10px] text-zinc-400">Enhance borders and text legibility</p>
            </div>
            <button
              onClick={() => handleUpdateA11y({ highContrast: !a11y.highContrast })}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                a11y.highContrast ? "bg-brand-600" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  a11y.highContrast ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

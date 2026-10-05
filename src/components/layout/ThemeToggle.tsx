"use client"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("theme")
    if (stored === "dark") {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    } else {
      setTheme("light")
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  if (!mounted) {
    return (
      <button
        aria-label="Toggle dark mode"
        className="btn-ghost p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-lg transition-colors"
      >
        <span className="w-4 h-4 block" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="btn-ghost p-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-xl transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      {theme === "dark" ? (
        <Sun size={19} className="text-amber-400 transition-transform rotate-0 hover:rotate-45" />
      ) : (
        <Moon size={19} className="text-zinc-600 transition-transform rotate-0 hover:-rotate-12" />
      )}
    </button>
  )
}

"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface AnimatedButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: (e: React.MouseEvent) => void
  className?: string
  innerClassName?: string
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  accentColor?: string // Defaults to red-600 (#ff293c)
}

/**
 * AnimatedButton with a dynamic angled red swipe on hover.
 * Slower, smoother, and tuned with red accent as requested.
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  href,
  onClick,
  className,
  innerClassName,
  type = "button",
  disabled = false,
  accentColor = "bg-red-600",
}) => {
  const baseClasses = cn(
    "relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-bold transition-all rounded-xl group border border-white/20 hover:border-red-500 shadow-md",
    disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer",
    className
  )

  const content = (
    <>
      {/* 40-degree angled red swipe layer */}
      <span
        className={cn(
          "w-60 h-60 rounded rotate-[-40deg] absolute bottom-0 left-0 -translate-x-full ease-out duration-700 transition-all translate-y-full mb-9 ml-9 group-hover:ml-0 group-hover:mb-32 group-hover:translate-x-0 pointer-events-none",
          accentColor
        )}
      />
      {/* Button Content */}
      <span
        className={cn(
          "relative z-10 w-full text-center transition-colors duration-400 ease-in-out flex items-center justify-center gap-2",
          innerClassName
        )}
      >
        {children}
      </span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={baseClasses} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={baseClasses}>
      {content}
    </button>
  )
}

export const Component = () => {
  return (
    <div className={cn("flex flex-col items-center gap-4 p-4 rounded-lg")}>
      <AnimatedButton href="/shop">
        <span>Add To Cart</span>
      </AnimatedButton>
    </div>
  )
}

export default AnimatedButton

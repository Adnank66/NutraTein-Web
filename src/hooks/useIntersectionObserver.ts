"use client"

import { useEffect, useRef, useState, RefObject } from "react"

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean
}

/**
 * Custom React hook leveraging native Browser Intersection Observer API
 * for lazy-loading heavy UI elements, virtualizing lists, and boosting Core Web Vitals.
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [RefObject<HTMLDivElement | null>, boolean] {
  const { threshold = 0.1, root = null, rootMargin = "50px", freezeOnceVisible = true } = options
  const elementRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = elementRef.current
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsVisible(true)
      return
    }

    if (freezeOnceVisible && isVisible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting
        setIsVisible(visible)
        if (visible && freezeOnceVisible) {
          observer.unobserve(node)
        }
      },
      { threshold, root, rootMargin }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [threshold, root, rootMargin, freezeOnceVisible, isVisible])

  return [elementRef, isVisible]
}

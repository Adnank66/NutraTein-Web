"use client"

import React, { useState, useEffect, useRef, UIEvent } from "react"

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  height: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
}

/**
 * Lightweight, zero-dependency Virtualized List component.
 * Only renders visible DOM items within the viewport plus overscan buffer,
 * preventing memory leaks and DOM bloat on long datasets (Core Web Vitals FID/INP boost).
 */
export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  className = "",
  overscan = 3,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const totalCount = items.length
  const totalHeight = totalCount * itemHeight

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(height / itemHeight) + 2 * overscan
  const endIndex = Math.min(totalCount, startIndex + visibleCount)

  const visibleItems = items.slice(startIndex, endIndex)
  const offsetY = startIndex * itemHeight

  return (
    <div
      onScroll={handleScroll}
      style={{ height, overflowY: "auto", position: "relative" }}
      className={`virtualized-container scrollbar-thin ${className}`}
    >
      <div style={{ height: totalHeight, width: "100%", position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

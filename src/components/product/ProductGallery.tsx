"use client"
import { useState } from "react"
import Image from "next/image"

interface GalleryProps {
  images?: any[]
  name?: string
  productName?: string
}

export default function ProductGallery({ images = [], name, productName }: GalleryProps) {
  const title = productName || name || "Product Image"
  const list = images.length > 0
    ? images.map((img) => (typeof img === "string" ? { url: img, alt: title } : { url: img.url, alt: img.alt || title }))
    : [{ url: "/assets/products/whey.jpg", alt: title }]

  const [activeIdx, setActiveIdx] = useState(0)

  return (
    <div className="space-y-4 w-full">
      <div className="card overflow-hidden bg-white dark:bg-zinc-900/50 relative border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center w-full aspect-square max-h-[550px] group rounded-3xl">
        <Image
          src={list[activeIdx]?.url || list[0].url}
          alt={list[activeIdx]?.alt || title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-4 sm:p-8 transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      {list.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {list.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 shrink-0 transition-all ${
                activeIdx === idx
                  ? "border-brand-500 shadow-sm ring-1 ring-brand-500"
                  : "border-zinc-200 opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt={img.alt || title} fill className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
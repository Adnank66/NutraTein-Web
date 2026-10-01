"use client"

import React from "react"
import CoverflowCarousel, { ProductCardItem } from "@/components/ui/3-d-coverflow-carousel"

interface FeaturedCoverflowClientProps {
  products?: ProductCardItem[]
}

export default function FeaturedCoverflowClient({ products }: FeaturedCoverflowClientProps) {
  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800/80 bg-gradient-to-b from-white via-zinc-50/50 to-white dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950">
      <CoverflowCarousel
        products={products}
        title="FEATURED PRODUCTS"
        subtitle="Engineered for peak performance, ultra-fast muscle recovery, and lab-certified purity."
        badgeText="ELITE ATHLETE FORMULAS"
        autoplay={true}
        autoplayDelay={4500}
      />
    </div>
  )
}

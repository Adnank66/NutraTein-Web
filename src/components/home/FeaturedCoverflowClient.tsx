"use client"

import React from "react"
import CoverflowCarousel, { ProductCardItem } from "@/components/ui/3-d-coverflow-carousel"
import { useTranslation } from "@/hooks/useTranslation"

interface FeaturedCoverflowClientProps {
  products?: ProductCardItem[]
}

export default function FeaturedCoverflowClient({ products }: FeaturedCoverflowClientProps) {
  const { t } = useTranslation()
  return (
    <div className="border-b border-zinc-100 dark:border-zinc-800/80 bg-gradient-to-b from-white via-zinc-50/50 to-white dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950">
      <CoverflowCarousel
        products={products}
        title={t("home.featured")}
        subtitle={t("home.featuredDesc")}
        badgeText={t("home.eliteAthleteFormulas")}
        autoplay={true}
        autoplayDelay={4500}
      />
    </div>
  )
}

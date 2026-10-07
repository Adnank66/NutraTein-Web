"use client"

import StaggerTestimonials from "@/components/ui/stagger-testimonials"

import Link from "next/link"

export default function CustomerReviews() {
  return (
    <section
      className="w-full py-16 sm:py-20 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 relative"
      aria-label="What Our Customers Say"
    >
      <div className="absolute top-16 right-4 sm:top-20 sm:right-10 z-10 hidden sm:block">
        <Link href="/write-review" className="btn-primary text-xs px-4 py-2 shadow-lg shadow-brand-500/20">
          Write a Review
        </Link>
      </div>
      <StaggerTestimonials
        title="What Our Customers Say"
        subtitle="Real feedback from the NUTRATEIN community"
        showHeader={true}
        showSummary={true}
        showFilters={true}
      />
      <div className="flex justify-center mt-8 sm:hidden">
        <Link href="/write-review" className="btn-primary text-sm px-6 py-3 w-[90%] text-center shadow-lg shadow-brand-500/20">
          Write a Review
        </Link>
      </div>
    </section>
  )
}
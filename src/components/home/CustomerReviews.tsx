"use client"

import StaggerTestimonials from "@/components/ui/stagger-testimonials"

export default function CustomerReviews() {
  return (
    <section
      className="w-full py-16 sm:py-20 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800"
      aria-label="What Our Customers Say"
    >
      <StaggerTestimonials
        title="What Our Customers Say"
        subtitle="Real feedback from the NUTRATEIN community"
        showHeader={true}
        showSummary={true}
        showFilters={true}
      />
    </section>
  )
}
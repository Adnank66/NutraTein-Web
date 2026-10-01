import Link from "next/link"
import { ArrowRight } from "lucide-react"
import RevealText from "@/components/ui/reveal-text"

const categories = [
  { name: "Whey Protein", slug: "whey-protein", icon: "🥛", desc: "Fast-absorbing muscle fuel", count: "2 products" },
  { name: "Creatine", slug: "creatine", icon: "⚡", desc: "Power & ATP output", count: "1 product" },
  { name: "Mass Gainers", slug: "mass-gainers", icon: "💪", desc: "Calorie & bulk support", count: "1 product" },
  { name: "Pre-Workout", slug: "pre-workout", icon: "🔥", desc: "High energy & pumps", count: "1 product" },
  { name: "Fat Burner", slug: "fat-burner", icon: "💧", desc: "Energy & fat loss", count: "1 product" },
  { name: "Sports Supplements", slug: "sports-supplements", icon: "💊", desc: "Strength & performance", count: "1 product" },
  { name: "Plant Protein", slug: "plant-protein", icon: "🌿", desc: "Clean vegan nutrition", count: "Coming Soon" },
  { name: "Gear", slug: "gear", icon: "🥤", desc: "Shakers & gym gear", count: "1 product" },
]

export default function Categories() {
  return (
    <section className="py-16 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Explore Catalog</span>
            <RevealText
              text="Shop by Category"
              as="h2"
              size="custom"
              duration={0.35}
              stagger={0.02}
              className="section-title mt-1 !justify-start !text-left !px-0 text-zinc-900 dark:text-white"
            />
            <p className="section-subtitle">Find the targeted nutrition formulas designed for your fitness goals.</p>
          </div>
          <Link href="/shop" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 mt-3 sm:mt-0 transition-colors">
            View All Categories <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="card p-4 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-brand-500/50 hover:bg-brand-50/20 dark:hover:bg-zinc-800/60 group flex flex-col items-center justify-between transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-2.5">
                {c.icon}
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
                  {c.name}
                </h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{c.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
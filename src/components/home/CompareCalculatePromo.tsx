import Link from "next/link"
import { ArrowRight, Calculator, ArrowLeftRight } from "lucide-react"
import RevealText from "@/components/ui/reveal-text"

export default function CompareCalculatePromo() {
  return (
    <section className="py-12 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="container-custom">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Tools</span>
          <RevealText
            text="Compare & Calculate"
            as="h2"
            size="custom"
            duration={0.35}
            stagger={0.02}
            className="section-title mt-1 !justify-center !text-center text-zinc-900 dark:text-white"
          />
          <p className="section-subtitle mx-auto">Find why NUTRATEIN wins every comparison — and calculate your exact daily protein goal.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Compare Card */}
          <Link
            href="/compare-calculate#compare"
            className="group flex items-start gap-5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 hover:border-brand-400 dark:hover:border-brand-600 transition-all hover:shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="text-brand-600 dark:text-brand-400" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">Compare Products</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                See why NUTRATEIN Whey outperforms generic budget proteins — side-by-side comparison with real specs, lab certifications, and taste scores.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 mt-3 group-hover:gap-2 transition-all">
                Compare Now <ArrowRight size={12} />
              </span>
            </div>
          </Link>

          {/* Calculate Card */}
          <Link
            href="/compare-calculate#calculate"
            className="group flex items-start gap-5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all hover:shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Calculator className="text-emerald-600 dark:text-emerald-400" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">Protein Calculator</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Find your daily protein goal based on your weight, activity level, and fitness target. Get personalized supplement recommendations instantly.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-3 group-hover:gap-2 transition-all">
                Calculate Now <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}

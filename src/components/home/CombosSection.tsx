import Link from "next/link"
import { Sparkles, ArrowRight, Check } from "lucide-react"
import { formatPrice } from "@/lib/utils"

const combos = [
  {
    title: "Ultimate Muscle Building Combo",
    slug: "proteinx-ultimate-muscle-building-combo",
    tag: "MOST POPULAR",
    price: 3999,
    mrp: 5797,
    savings: 1798,
    items: [
      "100% Gold Whey Isolate (1kg)",
      "Micronized Pure Creatine (250g)",
      "Pro Matte Black Shaker (700ml)"
    ],
    bg: "from-brand-500/10 to-orange-500/5",
    border: "border-brand-500/30"
  },
  {
    title: "Explosive Pre-Workout Stack",
    slug: "proteinx-explosive-pre-workout-stack",
    tag: "ENERGY STACK",
    price: 2699,
    mrp: 3797,
    savings: 1098,
    items: [
      "HyperDrive Pre-Workout 3.0 (360g)",
      "Micronized Pure Creatine (250g)",
      "Pro Shaker Bottle (700ml)"
    ],
    bg: "from-red-500/10 to-rose-500/5",
    border: "border-red-500/30"
  },
  {
    title: "Lean Definition & Recovery Kit",
    slug: "proteinx-organic-plant-protein",
    tag: "CLEAN FUEL",
    price: 3499,
    mrp: 4798,
    savings: 1299,
    items: [
      "Organic Plant Protein 25g (1kg)",
      "HydroFuel Intra-Workout BCAA (330g)",
      "Pro Matte Black Shaker (700ml)"
    ],
    bg: "from-emerald-500/10 to-green-500/5",
    border: "border-emerald-500/30"
  }
]

export default function CombosSection() {
  return (
    <section className="py-16 bg-dark-900 text-white">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-400 text-xs font-bold px-3.5 py-1.5 rounded-full mb-3">
            <Sparkles size={14} />
            CURATED VALUE BUNDLES
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Save Up to 35% with Stacks</h2>
          <p className="text-dark-400 mt-2">Combined supplements designed to work synergistically for optimal progress.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {combos.map((combo) => (
            <div
              key={combo.slug}
              className={`rounded-2xl p-6 bg-gradient-to-b ${combo.bg} border ${combo.border} flex flex-col justify-between hover:scale-[1.02] transition-all`}
            >
              <div>
                <span className="badge bg-brand-500 text-white font-bold text-[10px] tracking-wide mb-3">
                  {combo.tag}
                </span>
                <h3 className="text-xl font-bold text-white mb-4">{combo.title}</h3>

                <ul className="space-y-2.5 mb-6">
                  {combo.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-xs sm:text-sm text-dark-300">
                      <div className="w-4 h-4 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-brand-400" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-white">{formatPrice(combo.price)}</span>
                    <span className="text-sm text-dark-400 line-through ml-2">{formatPrice(combo.mrp)}</span>
                  </div>
                  <span className="text-xs font-bold text-green-400 bg-green-950/50 border border-green-500/30 px-2 py-0.5 rounded">
                    Save {formatPrice(combo.savings)}
                  </span>
                </div>

                <Link
                  href={`/shop/${combo.slug}`}
                  className="btn-primary w-full justify-center py-2.5 text-sm"
                >
                  Buy Bundle Stack <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

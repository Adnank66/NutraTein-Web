import { Check, Minus, Sparkles } from "lucide-react"
import { formatPrice } from "@/lib/utils"

const comparisonRows = [
  { feature: "Protein per Serving", whey: "27g Pure Isolate", shred: "26g Peptides + CLA", gainer: "52g Heavy Mass Blend" },
  { feature: "Calories per Scoop", whey: "115 kcal", shred: "110 kcal", gainer: "450 kcal" },
  { feature: "Carbohydrates", whey: "< 1g", shred: "< 1.5g", gainer: "68g Clean Carbs" },
  { feature: "Added Fat Burners / Enzymes", whey: "DigeZyme® Multi-Enzyme", shred: "L-Carnitine + CLA + Green Tea", gainer: "Digestive Enzyme Complex" },
  { feature: "Absorption Speed", whey: "Ultra Fast (30-45 mins)", shred: "Fast (45-60 mins)", gainer: "Sustained Release" },
  { feature: "Primary Fitness Goal", whey: "Lean Muscle Hypertrophy", shred: "Calorie Burn & Shredding", gainer: "Mass & Weight Surplus" },
  { feature: "Selling Price", whey: formatPrice(4499), shred: formatPrice(4499), gainer: formatPrice(3999) },
]

export default function ProductComparison() {
  return (
    <section className="py-16 bg-zinc-50 border-b border-zinc-200/60">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Side-by-Side Matrix</span>
          <h2 className="section-title">Compare Formulas</h2>
          <p className="section-subtitle mx-auto">
            Understand key nutritional differences across our signature formulas to choose the ideal fuel for your routine.
          </p>
        </div>

        <div className="card overflow-hidden bg-white border border-zinc-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-900">
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider text-[11px] text-zinc-500 w-1/4">Specification</th>
                  <th className="p-4 font-bold text-xs text-brand-600 w-1/4 bg-brand-50/40">Nitro-Tein Whey Protein</th>
                  <th className="p-4 font-bold text-xs text-zinc-900 w-1/4">Shred-Tein Lean Protein</th>
                  <th className="p-4 font-bold text-xs text-zinc-900 w-1/4">Mass-Tein Anabolic Gainer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {comparisonRows.map((r, i) => (
                  <tr key={r.feature} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50/40"}>
                    <td className="p-4 font-semibold text-zinc-700">{r.feature}</td>
                    <td className="p-4 font-bold text-zinc-900 bg-brand-50/20">{r.whey}</td>
                    <td className="p-4 text-zinc-700">{r.shred}</td>
                    <td className="p-4 text-zinc-700">{r.gainer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
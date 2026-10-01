"use client"
import { useState } from "react"
import Link from "next/link"
import { Calculator, ArrowRight, Info, Sparkles } from "lucide-react"

export default function ProteinCalculator() {
  const [weight, setWeight] = useState(70)
  const [activity, setActivity] = useState<"sedentary" | "moderate" | "intense">("moderate")
  const [goal, setGoal] = useState<"maintain" | "build" | "fatloss">("build")

  // Calculate estimated protein range in grams
  const calculateRange = () => {
    let multiplierMin = 1.4
    let multiplierMax = 1.8

    if (activity === "sedentary") {
      multiplierMin = 1.0
      multiplierMax = 1.2
    } else if (activity === "intense") {
      multiplierMin = 1.8
      multiplierMax = 2.2
    }

    if (goal === "build") {
      multiplierMin += 0.2
      multiplierMax += 0.2
    } else if (goal === "fatloss") {
      multiplierMin += 0.1
      multiplierMax += 0.3
    }

    const min = Math.round(weight * multiplierMin)
    const max = Math.round(weight * multiplierMax)
    return { min, max }
  }

  const { min, max } = calculateRange()

  return (
    <section className="py-16 bg-zinc-50 border-b border-zinc-200/60">
      <div className="container-custom max-w-4xl">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
            <Calculator size={13} />
            <span>INTERACTIVE NUTRITION TOOL</span>
          </div>
          <h2 className="section-title">Daily Protein Intake Calculator</h2>
          <p className="section-subtitle mx-auto">
            Estimate your recommended daily protein intake based on your bodyweight, routine, and targets.
          </p>
        </div>

        <div className="card p-6 sm:p-8 bg-white border border-zinc-200 shadow-sm space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Weight Input */}
            <div>
              <label className="label flex items-center justify-between">
                <span>Body Weight (kg)</span>
                <span className="text-brand-600 font-bold">{weight} kg</span>
              </label>
              <input
                type="range"
                min="40"
                max="140"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                <span>40 kg</span>
                <span>90 kg</span>
                <span>140 kg</span>
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="label">Activity Level</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value as any)}
                className="input text-xs"
              >
                <option value="sedentary">Sedentary (Desk Job, Light Walk)</option>
                <option value="moderate">Moderate (3-4 Gym Days / Week)</option>
                <option value="intense">Intense (5-6 Heavy Sessions / Athlete)</option>
              </select>
            </div>

            {/* Fitness Goal */}
            <div>
              <label className="label">Primary Fitness Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as any)}
                className="input text-xs"
              >
                <option value="build">Build Muscle & Strength</option>
                <option value="maintain">Maintain Current Physique</option>
                <option value="fatloss">Fat Loss & Muscle Retention</option>
              </select>
            </div>
          </div>

          {/* Result Card */}
          <div className="p-6 rounded-2xl bg-zinc-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Estimated Daily Range</span>
              <div className="text-3xl sm:text-4xl font-black text-white">
                {min}g – {max}g <span className="text-xs sm:text-sm font-normal text-zinc-400">protein / day</span>
              </div>
              <p className="text-xs text-zinc-400 max-w-md pt-1">
                Equivalent to approximately 2-3 nutritious whole food meals plus 1-2 scoops of clean protein supplement.
              </p>
            </div>

            <Link href="/shop" className="btn-primary py-3 px-6 text-xs font-bold shrink-0">
              Explore Products <ArrowRight size={14} />
            </Link>
          </div>

          {/* Non-medical Disclaimer */}
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-500">
            <Info size={16} className="text-zinc-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Educational Estimate:</strong> Protein requirements vary based on personal metabolism, medical conditions, and training load. This calculator is provided for general fitness planning and is not medical advice. Consider consulting a registered dietitian for personalized dietary requirements.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeftRight,
  Calculator,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShoppingCart,
} from "lucide-react"
import RevealText from "@/components/ui/reveal-text"

// ── NUTRATEIN reference data ──────────────────────────────────────────────────
const NUTRATEIN = {
  name: "NUTRATEIN 100% Whey",
  brand: "NUTRATEIN",
  pricePerServing: "₹75",
  proteinPerServing: "27g",
  bcaa: "6.2g",
  fillers: "Zero fillers / No amino spiking",
  labTested: true,
  noFillers: true,
  returnPolicy: "7-day hassle-free",
  tasteScore: "9.2 / 10",
  rating: "4.8 ★",
  badges: ["Lab Certified", "No Amino Spiking", "Best Seller"],
}

// ── Generic competitor data ───────────────────────────────────────────────────
const GENERICS = [
  {
    name: "Budget Whey Brand A",
    pricePerServing: "₹60",
    proteinPerServing: "22g",
    bcaa: "4.1g",
    fillers: "Maltodextrin filler added",
    labTested: false,
    noFillers: false,
    returnPolicy: "No returns accepted",
    tasteScore: "6.1 / 10",
    rating: "3.2 ★",
  },
  {
    name: "Cheap Whey Brand B",
    pricePerServing: "₹55",
    proteinPerServing: "20g",
    bcaa: "3.8g",
    fillers: "Amino spiked (Glycine/Taurine)",
    labTested: false,
    noFillers: false,
    returnPolicy: "7-day store credit only",
    tasteScore: "5.8 / 10",
    rating: "3.0 ★",
  },
  {
    name: "Generic Store Brand",
    pricePerServing: "₹50",
    proteinPerServing: "18g",
    bcaa: "3.2g",
    fillers: "Added sugars & artificial colours",
    labTested: false,
    noFillers: false,
    returnPolicy: "No returns",
    tasteScore: "5.2 / 10",
    rating: "2.9 ★",
  },
]

// ── Calculator constants ──────────────────────────────────────────────────────
const ACTIVITY_LABELS = [
  "Sedentary (desk job, little/no exercise)",
  "Lightly Active (1–3 days/week)",
  "Moderately Active (3–5 days/week)",
  "Very Active (6–7 days/week)",
  "Extremely Active (2× training/day)",
]
const ACTIVITY_MULT = [1.0, 1.1, 1.2, 1.3, 1.4]

const GOAL_LABELS = ["Maintain Weight", "Build Lean Muscle", "Lose Fat / Shred", "Bulk / Mass Gain"]
const GOAL_MULT = [0.8, 1.6, 2.0, 2.2]
const GOAL_COLORS = ["zinc", "brand", "emerald", "amber"]

// ── Helper row component ──────────────────────────────────────────────────────
function Row({
  label,
  ours,
  theirs,
  oursIsBool = false,
  theirsIsBool = false,
  ourGood = true,
}: {
  label: string
  ours: string | boolean
  theirs: string | boolean
  oursIsBool?: boolean
  theirsIsBool?: boolean
  ourGood?: boolean
}) {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      <td className="py-3 px-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 w-1/3">{label}</td>
      <td className="py-3 px-4 text-center bg-brand-50/50 dark:bg-brand-950/20">
        {oursIsBool ? (
          typeof ours === "boolean" && ours ? (
            <CheckCircle size={16} className="mx-auto text-emerald-500" />
          ) : (
            <XCircle size={16} className="mx-auto text-rose-400" />
          )
        ) : (
          <span className={`text-xs font-bold ${ourGood ? "text-brand-700 dark:text-brand-300" : "text-zinc-700 dark:text-zinc-200"}`}>
            {String(ours)}
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-center">
        {theirsIsBool ? (
          typeof theirs === "boolean" && theirs ? (
            <CheckCircle size={16} className="mx-auto text-emerald-500" />
          ) : (
            <XCircle size={16} className="mx-auto text-rose-400" />
          )
        ) : (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{String(theirs)}</span>
        )}
      </td>
    </tr>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CompareCalculatePage() {
  const [competitor, setCompetitor] = useState(0)
  const [weight, setWeight] = useState(70)
  const [activity, setActivity] = useState(2)
  const [goal, setGoal] = useState(1)
  const [result, setResult] = useState<number | null>(null)

  const compareRef = useRef<HTMLDivElement>(null)
  const calcRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hash = window.location.hash
    if (hash === "#calculate") {
      setTimeout(() => calcRef.current?.scrollIntoView({ behavior: "smooth" }), 300)
    } else if (hash === "#compare") {
      setTimeout(() => compareRef.current?.scrollIntoView({ behavior: "smooth" }), 300)
    }
  }, [])

  const calculate = () => {
    const grams = Math.round(weight * GOAL_MULT[goal] * ACTIVITY_MULT[activity])
    setResult(grams)
  }

  const g = GENERICS[competitor]
  const servings = result ? Math.ceil(result / 27) : null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-12">
        <div className="container-custom text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Nutrition Tools
          </span>
          <RevealText
            text="Compare & Calculate"
            as="h1"
            size="custom"
            duration={0.35}
            stagger={0.02}
            className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white mt-2 !justify-center !text-center"
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-lg mx-auto">
            See why NUTRATEIN beats generic whey every time — and calculate your exact daily protein target.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            <a
              href="#compare"
              className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              <ArrowLeftRight size={13} /> Product Comparison
            </a>
            <a
              href="#calculate"
              className="inline-flex items-center gap-2 bg-brand-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-colors"
            >
              <Calculator size={13} /> Protein Calculator
            </a>
          </div>
        </div>
      </div>

      {/* ─── COMPARISON SECTION ───────────────────────────────────────────── */}
      <div ref={compareRef} id="compare" className="py-16">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Side-by-Side
            </span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              Why Athletes Choose NUTRATEIN Over Generic Whey
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Real specs. No marketing fluff. The difference is clear.
            </p>
          </div>

          {/* Competitor Selector */}
          <div className="flex flex-wrap items-center gap-2 justify-center mb-6">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mr-1">Compare vs:</span>
            {GENERICS.map((gen, i) => (
              <button
                key={i}
                onClick={() => setCompetitor(i)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  competitor === i
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                }`}
              >
                {gen.name}
              </button>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="py-4 px-4 text-left text-xs font-bold text-zinc-400 dark:text-zinc-500">Feature</th>
                  <th className="py-4 px-4 text-center bg-brand-50 dark:bg-brand-950/30 border-x border-brand-100 dark:border-brand-900">
                    <p className="text-xs font-black text-brand-700 dark:text-brand-300">{NUTRATEIN.name}</p>
                    <div className="flex flex-wrap justify-center gap-1 mt-1">
                      {NUTRATEIN.badges.map(b => (
                        <span
                          key={b}
                          className="text-[9px] font-bold bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded-full"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center">
                    <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{g.name}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-600">Generic / Budget Brand</p>
                  </th>
                </tr>
              </thead>
              <tbody>
                <Row label="Price per Serving" ours={NUTRATEIN.pricePerServing} theirs={g.pricePerServing} ourGood={false} />
                <Row label="Protein per Serving" ours={NUTRATEIN.proteinPerServing} theirs={g.proteinPerServing} />
                <Row label="BCAAs" ours={NUTRATEIN.bcaa} theirs={g.bcaa} />
                <Row label="Fillers / Spiking" ours={NUTRATEIN.fillers} theirs={g.fillers} />
                <Row label="Lab Certified" ours={NUTRATEIN.labTested} theirs={g.labTested} oursIsBool theirsIsBool />
                <Row label="No Amino Spiking" ours={NUTRATEIN.noFillers} theirs={g.noFillers} oursIsBool theirsIsBool />
                <Row label="Return Policy" ours={NUTRATEIN.returnPolicy} theirs={g.returnPolicy} />
                <Row label="Taste Score" ours={NUTRATEIN.tasteScore} theirs={g.tasteScore} />
                <Row label="Customer Rating" ours={NUTRATEIN.rating} theirs={g.rating} />
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
              You pay ₹15–25 more per serving for <strong className="text-zinc-700 dark:text-zinc-300">27g clean protein</strong> vs. 18–22g of potentially spiked protein.
              <br />That's more value per rupee, guaranteed.
            </p>
            <Link
              href="/shop?category=whey-protein"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
            >
              <ShoppingCart size={15} /> Shop NUTRATEIN Whey <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── CALCULATOR SECTION ───────────────────────────────────────────── */}
      <div
        ref={calcRef}
        id="calculate"
        className="py-16 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800"
      >
        <div className="container-custom max-w-2xl">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              AI Nutrition Tool
            </span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              Find Your Daily Protein Goal
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              Based on your body weight, activity level, and fitness goal.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 space-y-5">
            {/* Weight Input */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Body Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(Number(e.target.value))}
                min={30}
                max={200}
                className="w-full border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm font-bold bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Activity Level */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Activity Level
              </label>
              <select
                value={activity}
                onChange={e => setActivity(Number(e.target.value))}
                className="w-full border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {ACTIVITY_LABELS.map((l, i) => (
                  <option key={i} value={i}>{l}</option>
                ))}
              </select>
            </div>

            {/* Goal Selector */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Your Fitness Goal
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_LABELS.map((l, i) => (
                  <button
                    key={i}
                    onClick={() => setGoal(i)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      goal === i
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm"
                        : "bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={calculate}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black text-sm py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Calculator size={16} /> Calculate My Protein
            </button>
          </div>

          {/* Result */}
          {result !== null && (
            <div className="mt-6 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-2xl p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Your Daily Protein Target
              </p>
              <p className="text-6xl font-black text-brand-700 dark:text-brand-300 my-3">{result}g</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">of protein per day</p>

              {servings && (
                <div className="mt-3 bg-white dark:bg-zinc-900 rounded-xl p-3 border border-brand-100 dark:border-brand-900">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    ≈{" "}
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {servings} serving{servings > 1 ? "s" : ""}
                    </span>{" "}
                    of NUTRATEIN Whey per day ({servings * 27}g protein)
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/shop?category=whey-protein"
                  className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <ShoppingCart size={13} /> Get NUTRATEIN Whey
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Browse All Products <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}

          {/* How it's calculated */}
          <div className="mt-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              How we calculate
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Formula: <strong className="text-zinc-700 dark:text-zinc-300">Daily Protein = Body Weight × Goal Multiplier × Activity Multiplier</strong>.
              Multipliers are based on peer-reviewed sports nutrition guidelines (ISSN, ACSM).
              Individual needs may vary — consult a nutritionist for personalised advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

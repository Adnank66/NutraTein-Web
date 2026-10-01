"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Check, ShoppingBag, Sparkles, Layers } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/store/cart"
import { toast } from "sonner"
import RevealText from "@/components/ui/reveal-text"

export default function ComboBuilder() {
  const [stackCategories, setStackCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedProtein, setSelectedProtein] = useState<any>(null)
  const [selectedPerf, setSelectedPerf] = useState<any>(null)
  const [selectedHealth, setSelectedHealth] = useState<any>(null)

  useEffect(() => {
    fetch("/api/admin/combos")
      .then(r => r.json())
      .then(data => {
        if (data.combos && data.combos.length > 0) {
          setStackCategories(data.combos)
          if (data.combos[0]?.options?.length > 0) setSelectedProtein(data.combos[0].options[0])
          if (data.combos[1]?.options?.length > 0) setSelectedPerf(data.combos[1].options[0])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const addItem = useCartStore((s) => s.addItem)

  const items = [selectedProtein, selectedPerf, selectedHealth].filter(Boolean)
  const individualTotal = items.reduce((sum, item) => sum + item.price, 0)
  const bundleDiscount = Math.round(individualTotal * 0.15) // 15% stack savings
  const bundlePrice = individualTotal - bundleDiscount

  const handleAddBundle = () => {
    items.forEach((item) => {
      addItem({
        id: item.id,
        productId: item.id,
        name: item.name,
        brand: "PROTEINX",
        price: Math.round(item.price * 0.85),
        mrp: item.mrp,
        image: item.image,
        quantity: 1,
        size: item.size,
        stock: 50,
        slug: "shop",
      })
    })
    toast.success("Custom Stack Added to Cart!", {
      description: `Saved ${formatPrice(bundleDiscount)} with 15% Bundle Discount`,
    })
  }

  if (loading || stackCategories.length < 2 || !selectedProtein || !selectedPerf) {
    return <div className="py-16 text-center text-zinc-500">Loading combos...</div>
  }

  return (
    <section id="combos" className="py-16 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/80 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold">
            <Layers size={13} />
            <span>SAVE 15% EXTRA ON CUSTOM STACKS</span>
          </div>
          <RevealText
            text="Build Your Custom Stack"
            as="h2"
            size="custom"
            duration={0.35}
            stagger={0.02}
            className="section-title !justify-center !text-center text-zinc-900 dark:text-white"
          />
          <p className="section-subtitle mx-auto">
            Select your preferred core protein, performance booster, and health support to create an all-in-one bundle.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step 1: Protein */}
          <div className="card p-5 space-y-3 bg-zinc-50/40 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center justify-between">
              <span>{stackCategories[0].label}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Required</span>
            </h3>
            <div className="space-y-2.5">
              {stackCategories[0].options.map((opt: any) => {
                const isSelected = selectedProtein.id === opt.id
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setSelectedProtein(opt)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-white dark:bg-zinc-800 border-brand-500 shadow-sm ring-1 ring-brand-500"
                        : "bg-white/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{opt.name}</p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{opt.size}</p>
                      <p className="text-xs font-black text-brand-600 dark:text-brand-400 mt-1">{formatPrice(opt.price)}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-brand-500 text-white" : "border border-zinc-300 dark:border-zinc-600"
                    }`}>
                      {isSelected && <Check size={12} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Performance */}
          <div className="card p-5 space-y-3 bg-zinc-50/40 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center justify-between">
              <span>{stackCategories[1].label}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Required</span>
            </h3>
            <div className="space-y-2.5">
              {stackCategories[1].options.map((opt: any) => {
                const isSelected = selectedPerf.id === opt.id
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setSelectedPerf(opt)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-white dark:bg-zinc-800 border-brand-500 shadow-sm ring-1 ring-brand-500"
                        : "bg-white/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{opt.name}</p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{opt.size}</p>
                      <p className="text-xs font-black text-brand-600 dark:text-brand-400 mt-1">{formatPrice(opt.price)}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-brand-500 text-white" : "border border-zinc-300 dark:border-zinc-600"
                    }`}>
                      {isSelected && <Check size={12} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 3: Health / Gear */}
          <div className="card p-5 space-y-3 bg-zinc-50/40 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center justify-between">
              <span>{stackCategories[2].label}</span>
              <span className="text-zinc-400 dark:text-zinc-500 font-normal">Optional</span>
            </h3>
            <div className="space-y-2.5">
              {stackCategories[2].options.map((opt: any) => {
                const isSelected = selectedHealth?.id === opt.id
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setSelectedHealth(isSelected ? null : opt)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-white dark:bg-zinc-800 border-brand-500 shadow-sm ring-1 ring-brand-500"
                        : "bg-white/60 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{opt.name}</p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{opt.size}</p>
                      <p className="text-xs font-black text-brand-600 dark:text-brand-400 mt-1">{formatPrice(opt.price)}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-brand-500 text-white" : "border border-zinc-300 dark:border-zinc-600"
                    }`}>
                      {isSelected && <Check size={12} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bundle Summary Bar */}
        <div className="card p-6 mt-8 bg-zinc-900 text-white border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Custom Bundle Stack Summary</span>
            <p className="text-sm text-zinc-300">
              Includes: <strong className="text-white">{selectedProtein.name}</strong> + <strong className="text-white">{selectedPerf.name}</strong>
              {selectedHealth && <> + <strong className="text-white">{selectedHealth.name}</strong></>}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-zinc-400 line-through">Total: {formatPrice(individualTotal)}</span>
              <span className="badge-orange text-[10px] font-bold">15% Stack Discount Applied</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-zinc-400">Bundle Price</p>
              <p className="text-2xl font-black text-white">{formatPrice(bundlePrice)}</p>
            </div>
            <button
              onClick={handleAddBundle}
              className="btn-primary py-3 px-6 text-xs sm:text-sm font-bold shadow-lg shadow-brand-500/20"
            >
              <ShoppingBag size={16} /> Add Stack to Cart
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
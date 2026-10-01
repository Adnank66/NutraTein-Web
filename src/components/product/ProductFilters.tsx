"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, RotateCcw, ChevronDown, Check } from "lucide-react"

interface ProductFiltersProps {
  categories: { id: string; name: string; slug: string }[]
  brands?: string[]
  flavors?: string[]
}

export default function ProductFilters({ categories, brands, flavors = [] }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get("category") || ""
  const currentFlavor = searchParams.get("flavor") || ""
  const currentMinPrice = searchParams.get("minPrice") || ""
  const currentMaxPrice = searchParams.get("maxPrice") || ""
  const currentInStock = searchParams.get("inStock") === "true"

  const [openSection, setOpenSection] = useState({ category: true, price: true, flavor: true })

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value); else params.delete(key)
    params.delete("page")
    router.push("/shop?" + params.toString())
  }

  const hasFilters = currentCategory || currentFlavor || currentMinPrice || currentMaxPrice || currentInStock

  return (
    <div className="card p-5 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-dark-100">
        <div className="flex items-center gap-2 font-bold text-dark-900">
          <Filter size={18} className="text-brand-500" />
          <span>Filters</span>
        </div>
        {hasFilters && (
          <button
            onClick={() => router.push("/shop")}
            className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      <div>
        <button
          onClick={() => setOpenSection((p) => ({ ...p, category: !p.category }))}
          className="flex items-center justify-between w-full font-semibold text-sm text-dark-900 mb-3"
        >
          <span>Categories</span>
          <ChevronDown size={14} className={openSection.category ? "rotate-180" : ""} />
        </button>
        {openSection.category && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <button
              onClick={() => updateParam("category", null)}
              className={"flex items-center justify-between w-full text-left text-xs px-2.5 py-1.5 rounded-lg " + (!currentCategory ? "bg-brand-50 text-brand-600 font-bold" : "text-dark-600 hover:bg-dark-50")}
            >
              <span>All Categories</span>
              {!currentCategory && <Check size={12} />}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => updateParam("category", currentCategory === c.slug ? null : c.slug)}
                className={"flex items-center justify-between w-full text-left text-xs px-2.5 py-1.5 rounded-lg " + (currentCategory === c.slug ? "bg-brand-50 text-brand-600 font-bold" : "text-dark-600 hover:bg-dark-50")}
              >
                <span>{c.name}</span>
                {currentCategory === c.slug && <Check size={12} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-dark-100">
        <button
          onClick={() => setOpenSection((p) => ({ ...p, price: !p.price }))}
          className="flex items-center justify-between w-full font-semibold text-sm text-dark-900 mb-3"
        >
          <span>Price (₹)</span>
          <ChevronDown size={14} className={openSection.price ? "rotate-180" : ""} />
        </button>
        {openSection.price && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                defaultValue={currentMinPrice}
                onBlur={(e) => updateParam("minPrice", e.target.value || null)}
                className="input py-1.5 px-2 text-xs"
              />
              <span className="text-dark-400 text-xs">to</span>
              <input
                type="number"
                placeholder="Max"
                defaultValue={currentMaxPrice}
                onBlur={(e) => updateParam("maxPrice", e.target.value || null)}
                className="input py-1.5 px-2 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-dark-100">
        <label className="flex items-center gap-2 text-xs font-semibold text-dark-800 cursor-pointer">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={(e) => updateParam("inStock", e.target.checked ? "true" : null)}
            className="rounded text-brand-500 w-4 h-4"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {flavors && flavors.length > 0 && (
        <div className="pt-4 border-t border-dark-100">
          <button
            onClick={() => setOpenSection((p) => ({ ...p, flavor: !p.flavor }))}
            className="flex items-center justify-between w-full font-semibold text-sm text-dark-900 mb-3"
          >
            <span>Flavors</span>
            <ChevronDown size={14} className={openSection.flavor ? "rotate-180" : ""} />
          </button>
          {openSection.flavor && (
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {flavors.map((f) => (
                <button
                  key={f}
                  onClick={() => updateParam("flavor", currentFlavor === f ? null : f)}
                  className={"flex items-center justify-between w-full text-left text-xs px-2 py-1 rounded " + (currentFlavor === f ? "bg-brand-50 text-brand-600 font-bold" : "text-dark-600 hover:bg-dark-50")}
                >
                  <span className="truncate">{f}</span>
                  {currentFlavor === f && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShoppingCart,
  Zap,
  Tag,
  FileCode,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Package,
  Award
} from "lucide-react"
import { toast } from "sonner"
import { getAllCatalogProducts, CatalogProduct } from "@/data/products-catalog"
import { useCartStore } from "@/store/cart"

export default function CatalogPreviewPage() {
  const products = getAllCatalogProducts()
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "")
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<Record<string, number>>({})
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)

  const { addItem, openCart } = useCartStore()

  const currentProduct: CatalogProduct =
    products.find((p) => p.id === selectedProductId) || products[0]

  const currentVariantIdx = selectedVariantIdx[currentProduct.id] ?? 0
  const currentVariant = currentProduct.variants[currentVariantIdx] || currentProduct.variants[0]

  const handleSelectVariant = (productId: string, idx: number) => {
    setSelectedVariantIdx((prev) => ({ ...prev, [productId]: idx }))
  }

  const handleCopyCode = (product: CatalogProduct) => {
    const jsonStr = JSON.stringify(product, null, 2)
    navigator.clipboard.writeText(jsonStr)
    setCopiedSlug(product.slug)
    toast.success("JSON copied to clipboard", {
      description: `Copied ${product.name} config block. Paste in src/data/products-catalog.json.`
    })
    setTimeout(() => setCopiedSlug(null), 3000)
  }

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      setCopiedShareLink(true)
      toast.success("Preview link copied!", {
        description: "You can now share this URL to preview all image-based prices and cards."
      })
      setTimeout(() => setCopiedShareLink(false), 3000)
    }
  }

  const handleAddToCart = (product: CatalogProduct) => {
    const v = product.variants[selectedVariantIdx[product.id] ?? 0] || product.variants[0]
    addItem({
      id: `${product.id}-${v.id}`,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: v.price,
      mrp: v.mrp || v.originalPrice || product.mrp,
      image: v.image || product.image,
      quantity: 1,
      flavor: v.flavor || product.flavor,
      size: v.weight || v.size,
      stock: v.stock,
      slug: product.slug
    })
    toast.success("Added to cart", {
      description: `${product.name} (${v.weight || v.size}) • ₹${v.price.toLocaleString("en-IN")}`
    })
    openCart()
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Banner / Breadcrumb & Share Toolbar */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wider uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              NUTRATEIN Official Catalog & Image Price Verification
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Live Product Pricing & Poster Verification
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Inspect all 7 authentic poster images side-by-side with live 3D coverflow cards.
              All prices, weights, servings, and MRPs match the printed posters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition shadow-sm active:scale-95"
            >
              {copiedShareLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              {copiedShareLink ? "Link Copied!" : "Share Preview URL"}
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-sm"
            >
              <Layers className="w-4 h-4" />
              View 3D Showcase
            </Link>

            <a
              href="http://localhost:5000/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              Admin Panel
            </a>
          </div>
        </div>

        {/* Quick Product Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar border-b border-zinc-800/80">
          {products.map((p) => {
            const isSelected = p.id === currentProduct.id
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-amber-500 text-zinc-950 shadow-md font-extrabold"
                    : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                <span>{p.name.split(" ")[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  isSelected ? "bg-black/20 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400"
                }`}>
                  ₹{p.price.toLocaleString("en-IN")}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Verification Workstation: Side-by-Side Comparison */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Column: Authentic Poster / Packaging Image */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl relative flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Authentic Label / Poster
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {currentProduct.posterImage.split("/").pop()}
              </span>
            </div>

            {/* Poster High-Res Image View */}
            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-black/60 border border-zinc-800 flex items-center justify-center p-2 group">
              <Image
                src={currentProduct.posterImage}
                alt={currentProduct.posterTitle || currentProduct.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                priority
              />
              <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-center pointer-events-none">
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  {currentProduct.posterTitle || currentProduct.name}
                </p>
                <p className="text-[10px] text-amber-400 font-medium tracking-wide">
                  {currentProduct.tagline}
                </p>
              </div>
            </div>

            {/* Poster Key Specs Callout */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Official Poster MRP</span>
                <span className="text-amber-400 font-mono font-bold text-sm">
                  ₹{currentVariant.mrp?.toLocaleString("en-IN") || currentProduct.mrp.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] font-semibold uppercase">Printed Servings</span>
                <span className="text-zinc-200 font-mono font-bold text-sm">
                  {currentVariant.servings || currentProduct.servings}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Card & Store Preview */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex-1 flex flex-col justify-between">
            {/* Header with Badges */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-500/20 text-brand-400 border border-brand-500/30">
                    {currentProduct.badge || "FEATURED"}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {currentProduct.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <Award className="w-3.5 h-3.5" />
                  <span className="font-bold">{currentProduct.rating}</span>
                  <span className="text-zinc-500">({currentProduct.reviewCount} reviews)</span>
                </div>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {currentProduct.name}
              </h2>
              {currentProduct.tagline && (
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-1">
                  {currentProduct.tagline}
                </p>
              )}
              <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                {currentProduct.description}
              </p>

              {/* Verified Nutrition / Power Spec Strip */}
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentProduct.proteinPerServing}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
                  <Package className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentVariant.servings || currentProduct.servings}</span>
                </div>
              </div>

              {/* Interactive Variant Selector (Size / Weight) */}
              <div className="mt-6 pt-5 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Select Size / Packaging Weight:
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    {currentProduct.variants.length} available sizes
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {currentProduct.variants.map((v, idx) => {
                    const isSelected = idx === currentVariantIdx
                    return (
                      <button
                        key={v.id || idx}
                        onClick={() => handleSelectVariant(currentProduct.id, idx)}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500 text-white shadow-md ring-1 ring-amber-500/50"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs text-zinc-100">
                            {v.weight || v.size}
                          </span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-extrabold text-amber-400">
                            ₹{v.price.toLocaleString("en-IN")}
                          </span>
                          {v.mrp && (
                            <span className="text-[10px] text-zinc-500 line-through">
                              ₹{v.mrp.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        {v.servings && (
                          <span className="block text-[10px] text-zinc-400 mt-1">
                            {v.servings} Servings
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Flavours Available */}
              {currentProduct.flavors && currentProduct.flavors.length > 0 && (
                <div className="mt-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                    Printed Flavours on Poster:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {currentProduct.flavors.map((flv, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-950 border border-zinc-800 text-zinc-300"
                      >
                        {flv}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Price Display Block */}
              <div className="mt-6 p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-zinc-500 block font-medium">Selling Store Price</span>
                  <div className="flex items-baseline gap-2.5 mt-0.5">
                    <span className="text-3xl font-black text-white tracking-tight">
                      ₹{currentVariant.price.toLocaleString("en-IN")}
                    </span>
                    {(currentVariant.mrp || currentProduct.mrp) && (
                      <span className="text-sm font-semibold text-zinc-500 line-through">
                        MRP ₹{(currentVariant.mrp || currentProduct.mrp).toLocaleString("en-IN")}
                      </span>
                    )}
                    {currentVariant.discount && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {currentVariant.discount}% OFF
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    Inclusive of all taxes • Authentic Brand Direct
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddToCart(currentProduct)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-black text-xs transition shadow-lg shadow-amber-500/10"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <Link
                    href={`/shop/${currentProduct.slug}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition border border-zinc-700"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* VS Code Quick-Edit Inspector Assistant */}
            <div className="mt-6 pt-5 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span>Edit in VS Code</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    src/data/products-catalog.json
                  </span>
                </div>

                <button
                  onClick={() => handleCopyCode(currentProduct)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold transition"
                >
                  {copiedSlug === currentProduct.slug ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" /> Copy JSON
                    </>
                  )}
                </button>
              </div>

              {/* Code Snippet Box */}
              <div className="bg-black/90 rounded-lg p-3 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-40">
                <pre>
{`{
  "name": "${currentProduct.name}",
  "posterTitle": "${currentProduct.posterTitle || ""}",
  "price": ${currentVariant.price},
  "mrp": ${currentVariant.mrp || currentProduct.mrp},
  "weight": "${currentVariant.weight || currentVariant.size}",
  "servings": "${currentVariant.servings || currentProduct.servings}",
  "flavors": ${JSON.stringify(currentProduct.flavors || [])}
}`}
                </pre>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">
                💡 Tip: Open <code className="text-amber-400">src/data/products-catalog.json</code> in VS Code to edit prices or product text in seconds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complete All-7-Products Verification Matrix Table */}
      <div className="max-w-7xl mx-auto mt-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-white">Full Poster Pricing & Specification Matrix</h3>
            <p className="text-xs text-zinc-400">Summary of all authentic items with image-printed MRP and store rates.</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Poster / Product</th>
                <th className="py-3.5 px-4">Available Sizes</th>
                <th className="py-3.5 px-4">Servings</th>
                <th className="py-3.5 px-4">Printed Poster MRP</th>
                <th className="py-3.5 px-4">Store Selling Price</th>
                <th className="py-3.5 px-4">Savings</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {products.map((p) => {
                const primaryVariant = p.variants[0]
                const allMrps = p.variants.map((v) => `₹${(v.mrp || p.mrp).toLocaleString("en-IN")}`).join(" / ")
                const allPrices = p.variants.map((v) => `₹${v.price.toLocaleString("en-IN")}`).join(" / ")
                const allSizes = p.variants.map((v) => v.weight || v.size).join(" • ")

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-zinc-800/40 transition cursor-pointer ${
                      p.id === currentProduct.id ? "bg-amber-500/5 border-l-2 border-amber-500" : ""
                    }`}
                    onClick={() => setSelectedProductId(p.id)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black border border-zinc-800 relative overflow-hidden flex-shrink-0">
                          <Image src={p.posterImage} alt={p.name} fill className="object-contain" />
                        </div>
                        <div>
                          <span className="font-bold text-white block">{p.name}</span>
                          <span className="text-[10px] text-amber-400">{p.posterTitle || p.tagline}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 font-mono">{allSizes}</td>
                    <td className="py-3.5 px-4 text-zinc-300 font-mono">
                      {p.variants.map((v) => v.servings).filter(Boolean).join(" / ") || p.servings}
                    </td>
                    <td className="py-3.5 px-4 text-amber-400 font-mono font-bold">{allMrps}</td>
                    <td className="py-3.5 px-4 text-white font-mono font-black">{allPrices}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Up to {Math.max(...p.variants.map((v) => v.discount || p.discount))}% OFF
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(p)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 text-xs font-bold transition"
                      >
                        Add to Cart
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import ProductCard from "@/components/product/ProductCard"
import { Sparkles, Tag, Timer, Zap } from "lucide-react"
import ComboBuilder from "@/components/home/ComboBuilder"

export const dynamic = "force-dynamic"

export default async function DealsPage() {
  let deals: any[] = []
  let coupons: any[] = []

  try {
    const results = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, discountPercent: { gte: 20 } },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true }, take: 1, orderBy: { price: "asc" } },
          category: true,
        },
        orderBy: { discountPercent: "desc" },
      }),
      prisma.coupon.findMany({
        where: { isActive: true },
        orderBy: { discountValue: "desc" },
      }),
    ])
    deals = results[0]
    coupons = results[1]
  } catch (err) {
    console.warn("Deals page query fallback:", err)
  }

  return (
    <div className="py-10 bg-dark-50">
      <div className="container-custom space-y-12">
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-brand-600 via-orange-600 to-amber-600 p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white mb-4">
              <Timer size={14} className="animate-pulse text-amber-300" />
              FLASH DEALS & SPECIAL OFFERS
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-black mb-3 leading-tight">
              Huge Savings on Premium Nutrition
            </h1>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              Grab up to 35% off on our best-selling isolates, mass gainers, and stack bundles. Limited stock offers.
            </p>
          </div>
        </div>

        {/* Coupon codes card */}
        <div>
          <h2 className="text-xl font-bold text-dark-900 mb-4 flex items-center gap-2">
            <Tag size={20} className="text-brand-500" /> Active Promo Codes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coupons.map((c) => {
              if (c.productId || c.productImage) {
                return (
                  <div key={c.code} className="card overflow-hidden bg-white relative group flex flex-col md:col-span-2 shadow-sm border border-brand-200">
                    <div className="flex flex-col sm:flex-row h-full">
                      <div className="w-full sm:w-2/5 bg-dark-50 relative p-4 flex items-center justify-center min-h-[160px]">
                        <img src={c.productImage || "/assets/products/whey.jpg"} alt={c.productName || "Supplement"} className="w-32 h-32 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm" />
                      </div>
                      <div className="p-5 flex flex-col justify-center flex-1">
                        <div className="mb-2">
                          <span className="badge bg-brand-100 text-brand-700 text-[10px] font-bold mb-2 inline-block">
                            FEATURED DEAL
                          </span>
                          <h3 className="font-bold text-dark-900 text-lg leading-tight mb-1">
                            Save {c.discountType === "PERCENT" ? `${c.discountValue}%` : `₹${c.discountValue}`} on {c.productName || "this product"}
                          </h3>
                          <p className="text-xs text-dark-600 line-clamp-2">{c.description || "Limited time offer. Apply code at checkout."}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-dark-100 pt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-dark-500 uppercase tracking-wider">Use Code:</span>
                            <span className="font-mono font-bold text-brand-700 text-sm bg-brand-50 border border-brand-200 px-3 py-1 rounded-lg border-dashed">
                              {c.code}
                            </span>
                          </div>
                          <span className="text-[10px] text-dark-400 font-medium">Min order: ₹{c.minOrderValue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
              return (
                <div key={c.code} className="card p-4 border border-brand-200 bg-white relative overflow-hidden group shadow-sm flex flex-col">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <span className="font-mono font-bold text-brand-700 text-sm bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg border-dashed shrink-0">
                      {c.code}
                    </span>
                    <span className="badge bg-green-100 text-green-700 text-[10px] font-bold shrink-0">
                      {c.discountType === "PERCENT" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                    </span>
                  </div>
                  <p className="text-xs text-dark-600 mt-2 flex-1">{c.description || "Apply this code at checkout to save."}</p>
                  <div className="mt-3 pt-3 border-t border-dark-100">
                    <p className="text-[10px] text-dark-400 font-medium">
                      Min order: ₹{c.minOrderValue}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Products on Sale */}
        <div>
          <h2 className="text-2xl font-bold text-dark-900 mb-6 flex items-center gap-2">
            <Zap size={22} className="text-brand-500" /> Discounted Supplements
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {deals.map((product) => {
              const variant = product.variants[0]
              const image = product.images[0]?.url || "/assets/products/whey.jpg"
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  name={product.name}
                  brand={product.brand}
                  price={variant?.price ?? product.basePrice}
                  mrp={product.mrp}
                  discountPercent={product.discountPercent}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  image={image}
                  flavor={variant?.flavor ?? undefined}
                  size={variant?.size ?? undefined}
                  stock={variant?.stock ?? 50}
                  isBestSeller={product.isBestSeller}
                  isNew={product.isNew}
                  variantId={variant?.id}
                />
              )
            })}
          </div>
        </div>
      </div>
      <ComboBuilder />
    </div>
  )
}

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import ProductCard from "@/components/product/ProductCard"
import { prisma } from "@/lib/prisma"
import { withFastTimeout, getFallbackProducts } from "@/lib/fast-data"

export default async function FeaturedProducts() {
  const fallback = getFallbackProducts().slice(0, 8).map(p => ({
    ...p,
    variants: [{ price: p.price, flavor: p.flavor, size: p.size, stock: p.stock, id: p.variantId }],
    images: [{ url: p.image }]
  }))

  const products: any[] = await withFastTimeout(
    (async () => {
      const dbProducts = await prisma.product.findMany({
        where: { isActive: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true }, take: 1, orderBy: { price: "asc" } },
          category: true,
        },
        take: 8,
        orderBy: { rating: "desc" },
      })
      return (dbProducts && dbProducts.length > 0) ? dbProducts : fallback
    })(),
    fallback,
    200
  )

  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Trending Now</span>
            <h2 className="section-title mt-1">Best Selling Formulas</h2>
            <p className="section-subtitle">Top-rated supplements preferred by certified trainers and athletes.</p>
          </div>
          <Link href="/shop" className="btn-secondary hidden md:inline-flex mt-4 md:mt-0">
            View All Best Sellers <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
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

        <div className="text-center mt-10 md:hidden">
          <Link href="/shop" className="btn-secondary w-full justify-center">
            View All Best Sellers <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
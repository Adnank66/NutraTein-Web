import { prisma } from "@/lib/prisma"
import Hero from "@/components/home/Hero"
import FeaturedCoverflowSection from "@/components/home/FeaturedCoverflowSection"
import Categories from "@/components/home/Categories"
import TopProducts from "@/components/home/TopProducts"
import PersonalizedSection from "@/components/home/PersonalizedSection"
import WhyChooseUs from "@/components/home/WhyChooseUs"
import CompareCalculatePromo from "@/components/home/CompareCalculatePromo"
import ComboBuilder from "@/components/home/ComboBuilder"
import TrustPartners from "@/components/home/TrustPartners"
import CustomerReviews from "@/components/home/CustomerReviews"
import HomeFAQ from "@/components/home/HomeFAQ"
import FinalCTA from "@/components/home/FinalCTA"

import { withFastTimeout, getFallbackProducts } from "@/lib/fast-data"

export const dynamic = "force-dynamic"

async function getRecommendedProducts() {
  const fallback = getFallbackProducts().slice(0, 3)
  return withFastTimeout(
    (async () => {
      const products = await prisma.product.findMany({
        where: { isActive: true, rating: { gte: 3.5 } },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true }, take: 1, orderBy: { price: "asc" } },
          category: true,
        },
        take: 3,
        orderBy: [{ reviewCount: "desc" }, { rating: "desc" }],
      })
      if (!products || products.length === 0) return fallback
      return products.map((p) => {
        const variant = p.variants[0]
        const img = p.images[0]?.url || "/assets/products/whey.jpg"
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          brand: p.brand,
          price: variant?.price ?? p.basePrice,
          mrp: p.mrp,
          discountPercent: p.discountPercent,
          rating: p.rating,
          reviewCount: p.reviewCount,
          image: img,
          flavor: variant?.flavor ?? undefined,
          size: variant?.size ?? undefined,
          stock: variant?.stock ?? 50,
          isBestSeller: p.isBestSeller,
          isNew: p.isNew,
          variantId: variant?.id,
        }
      })
    })(),
    fallback,
    200
  )
}

export default async function HomePage() {
  const recommendedProducts = await getRecommendedProducts()

  return (
    <div className="space-y-0">
      {/* 1. Big Hero Banner */}
      <Hero />

      {/* 2. Featured Products — 3D Coverflow Showcase */}
      <FeaturedCoverflowSection />

      {/* 4. Categories Grid */}
      <Categories />

      {/* 5. Top Products / Best Sellers */}
      <TopProducts />

      {/* 6. Personalized Recommendations */}
      <PersonalizedSection initialProducts={recommendedProducts} />

      {/* 7. Why Choose Us */}
      <WhyChooseUs />

      {/* 8. Compare & Calculate Promo Cards */}
      <CompareCalculatePromo />

      {/* 9. Build Your Stack / Interactive Combo Builder */}
      <ComboBuilder />

      {/* 10. Trusted Security & Quality Compliance */}
      <TrustPartners />

      {/* 11. Verified Customer Reviews */}
      <CustomerReviews />

      {/* 12. Homepage FAQ Accordion */}
      <HomeFAQ />

      {/* 13. Final CTA & Newsletter */}
      <FinalCTA />
    </div>
  )
}
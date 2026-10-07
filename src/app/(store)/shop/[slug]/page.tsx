import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import ProductGallery from "@/components/product/ProductGallery"
import ProductDetails from "@/components/product/ProductDetails"
import ReviewForm from "@/components/product/ReviewForm"
import StaggerTestimonials from "@/components/ui/stagger-testimonials"
import ProductCard from "@/components/product/ProductCard"
import RatingStars from "@/components/ui/RatingStars"
import Link from "next/link"
import { withFastTimeout } from "@/lib/fast-data"
import { getAllCatalogProducts } from "@/data/products-catalog"
import FrequentlyBoughtTogether from "@/components/product/FrequentlyBoughtTogether"
import TrustBadges from "@/components/TrustBadges"
import NutritionFacts from "@/components/product/NutritionFacts"

export const dynamic = "force-dynamic"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

function normalizeSlug(val?: string): string {
  if (!val) return ""
  return val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params

  let product: any = null
  try {
    product = await withFastTimeout(
      prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
          variants: { where: { isActive: true }, orderBy: { price: "asc" } },
          reviews: {
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      null,
      300
    )
  } catch {
    product = null
  }

  // Fallback to authentic master catalog if product not in DB or DB unreachable
  if (!product) {
    const catalogItem = getAllCatalogProducts().find((p) => p.slug === slug)
    if (!catalogItem) notFound()

    product = {
      id: catalogItem.id,
      slug: catalogItem.slug,
      name: catalogItem.name,
      brand: catalogItem.brand || "NUTRATEIN",
      description: catalogItem.description,
      benefits:
        "100% authentic formulation engineered for peak muscle hypertrophy, explosive strength output, and rapid post-workout recovery.",
      howToUse:
        "Mix 1 scoop with 250-350ml cold water or preferred beverage. Consume post-workout or as advised by your fitness consultant.",
      ingredients:
        "Premium micronized ingredients, natural and artificial flavors, digestive enzyme matrix, stevia extract.",
      nutritionInfo: JSON.stringify([
        { nutrient: "Protein / Active Yield", amount: catalogItem.proteinPerServing || "Elite Grade" },
        { nutrient: "Serving Size", amount: catalogItem.servings || "Standard" },
        { nutrient: "Purity & Quality", amount: "100% Lab Tested & Certified" },
      ]),
      basePrice: catalogItem.price,
      mrp: catalogItem.mrp,
      discountPercent: catalogItem.discount,
      rating: catalogItem.rating,
      reviewCount: catalogItem.reviewCount,
      categoryId: `cat-${normalizeSlug(catalogItem.category)}`,
      category: {
        id: `cat-${normalizeSlug(catalogItem.category)}`,
        name: catalogItem.category,
        slug: normalizeSlug(catalogItem.category),
      },
      flavor: catalogItem.flavor || "Standard",
      flavors: catalogItem.flavors || (catalogItem.flavor ? [catalogItem.flavor] : []),
      images: [
        { id: "img-1", url: catalogItem.image, isPrimary: true, sortOrder: 0 },
        { id: "img-2", url: catalogItem.posterImage, isPrimary: false, sortOrder: 1 },
      ],
      variants: catalogItem.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        weight: v.weight,
        size: v.size,
        flavor: v.flavor || catalogItem.flavor || "Standard",
        price: v.price,
        mrp: v.mrp || catalogItem.mrp,
        stock: v.stock,
        isActive: true,
      })),
      reviews: [],
    }
  } else {
    // If loaded from DB, attach flavors from master catalog if missing
    const catalogMatch = getAllCatalogProducts().find((p) => p.slug === slug || p.id === product?.id)
    if (catalogMatch && (!product.flavors || product.flavors.length === 0)) {
      product.flavors = catalogMatch.flavors || (catalogMatch.flavor ? [catalogMatch.flavor] : [])
    }
  }

  // Related products
  let relatedProducts: any[] = []
  try {
    const isObjectId = product.categoryId && /^[0-9a-fA-F]{24}$/.test(product.categoryId)
    const isProdObjectId = product.id && /^[0-9a-fA-F]{24}$/.test(product.id)

    const whereClause: any = {
      isActive: true,
    }
    if (isProdObjectId) {
      whereClause.id = { not: product.id }
    } else {
      whereClause.slug = { not: slug }
    }
    if (isObjectId) {
      whereClause.categoryId = product.categoryId
    }

    relatedProducts = await withFastTimeout(
      prisma.product.findMany({
        where: whereClause,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true }, take: 1, orderBy: { price: "asc" } },
          category: true,
        },
        take: 4,
      }),
      [],
      250
    )
  } catch {
    relatedProducts = []
  }

  // Filter dummy images from DB related products
  relatedProducts = relatedProducts.filter((p) => {
    const img = p.images?.[0]?.url
    return img && !img.includes("unsplash") && !img.includes("placeholder")
  })

  // If no DB related products, pull from authentic catalog
  if (relatedProducts.length === 0) {
    relatedProducts = getAllCatalogProducts()
      .filter((p) => p.slug !== slug)
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand || "NUTRATEIN",
        basePrice: p.price,
        mrp: p.mrp,
        discountPercent: p.discount,
        rating: p.rating,
        reviewCount: p.reviewCount,
        category: { name: p.category, slug: normalizeSlug(p.category) },
        images: [{ url: p.image || p.posterImage }],
        variants: [
          {
            id: p.variants?.[0]?.id || p.id,
            price: p.variants?.[0]?.price ?? p.price,
            flavor: p.variants?.[0]?.flavor ?? p.flavor,
            size: p.variants?.[0]?.weight ?? p.weight,
            stock: p.variants?.[0]?.stock ?? p.stock,
          },
        ],
      }))
  }

  let nutritionTable: { nutrient: string; amount: string }[] = []
  try {
    if (product.nutritionInfo) nutritionTable = JSON.parse(product.nutritionInfo)
  } catch {
    nutritionTable = []
  }

  return (
    <div className="py-4 sm:py-8 bg-white min-h-[80vh]">
      <div className="container-custom px-3 sm:px-6">
        <div className="flex items-center gap-1.5 text-xs text-dark-400 mb-4 overflow-x-auto scrollbar-none whitespace-nowrap">
          <Link href="/" className="hover:text-dark-700 shrink-0">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-dark-700 shrink-0">Shop</Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category.slug}`} className="hover:text-dark-700 shrink-0">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-dark-900 font-semibold truncate max-w-[140px] sm:max-w-xs">{product.name}</span>
        </div>

        <div className="mb-8 sm:mb-16">
          <ProductDetails product={product} />
          <TrustBadges variant="horizontal" className="mt-8 border-t border-dark-100 pt-8" />
        </div>

        <div className="border-t border-dark-100 pt-12 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-dark-900">Product Overview & Science</h2>
              <p className="text-sm text-dark-600 leading-relaxed">{product.description}</p>

              {product.benefits && (
                <div className="card p-6 bg-brand-50/40 border border-brand-100">
                  <h3 className="font-bold text-dark-900 text-base mb-3">Key Benefits</h3>
                  <p className="text-xs sm:text-sm text-dark-700 leading-relaxed">{product.benefits}</p>
                </div>
              )}

              {product.howToUse && (
                <div className="card p-6 border border-dark-100 space-y-2">
                  <h3 className="font-bold text-dark-900 text-base">Recommended Usage</h3>
                  <p className="text-xs sm:text-sm text-dark-600 leading-relaxed">{product.howToUse}</p>
                </div>
              )}

              {product.ingredients && (
                <div className="card p-6 border border-dark-100 space-y-2">
                  <h3 className="font-bold text-dark-900 text-base">Ingredients</h3>
                  <p className="text-xs text-dark-500 leading-relaxed font-mono">{product.ingredients}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="card p-6 border-2 border-dark-900 space-y-4">
                <NutritionFacts
                  nutritionInfo={product.nutritionInfo}
                  ingredients={product.ingredients}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-dark-100 pt-10 space-y-8">
            <StaggerTestimonials
              productId={product.id}
              productName={product.name}
              title="Customer Reviews"
              subtitle={`Verified feedback from athletes using ${product.name}`}
              showHeader={true}
              showSummary={true}
              showFilters={true}
            />

            <div className="max-w-xl mx-auto pt-6 border-t border-zinc-100">
              <ReviewForm productId={product.id} />
            </div>
          </div>

          {/* AI Synergy Bundle — Frequently Bought Together */}
          <div className="border-t border-dark-100 pt-10">
            <FrequentlyBoughtTogether
              productId={product.id}
              productName={product.name}
              productPrice={product.basePrice}
            />
          </div>

          {relatedProducts.length > 0 && (
            <div className="border-t border-dark-100 pt-10">
              <h2 className="text-2xl font-bold text-dark-900 mb-6">More Recommendations & Stacks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((p) => {
                  const variant = p.variants?.[0]
                  const image = p.images?.[0]?.url || p.image || "/assets/products/creatine.jpg"
                  return (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      slug={p.slug}
                      name={p.name}
                      brand={p.brand}
                      price={variant?.price ?? p.basePrice}
                      mrp={p.mrp}
                      discountPercent={p.discountPercent}
                      rating={p.rating}
                      reviewCount={p.reviewCount}
                      image={image}
                      stock={variant?.stock ?? 50}
                      isBestSeller={p.isBestSeller}
                      isNew={p.isNew}
                      variantId={variant?.id}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

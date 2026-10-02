import { prisma } from "@/lib/prisma"
import ProductCard from "@/components/product/ProductCard"
import ProductFilters from "@/components/product/ProductFilters"
import Link from "next/link"
import { withFastTimeout } from "@/lib/fast-data"
import { getAllCatalogProducts } from "@/data/products-catalog"

export const dynamic = "force-dynamic"

interface ShopPageProps {
  searchParams: Promise<{
    category?: string
    brand?: string
    flavor?: string
    minPrice?: string
    maxPrice?: string
    inStock?: string
    sort?: string
    page?: string
  }>
}

function normalizeSlug(val?: string): string {
  if (!val) return ""
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const AUTHENTIC_CATEGORIES = [
  { id: "cat-whey", name: "Whey Protein", slug: "whey-protein" },
  { id: "cat-creatine", name: "Creatine", slug: "creatine" },
  { id: "cat-mass", name: "Mass Gainers", slug: "mass-gainers" },
  { id: "cat-preworkout", name: "Pre-Workout", slug: "pre-workout" },
  { id: "cat-fatburner", name: "Fat Burner", slug: "fat-burner" },
  { id: "cat-sports", name: "Sports Supplements", slug: "sports-supplements" },
  { id: "cat-gear", name: "Gear", slug: "gear" },
]

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const categorySlug = params.category ? normalizeSlug(params.category) : undefined
  const brandParam = params.brand
  const flavorParam = params.flavor
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : undefined
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : undefined
  const inStock = params.inStock === "true"
  const sort = params.sort || "popular"
  const page = parseInt(params.page || "1", 10)
  const pageSize = 12

  // 1. Prepare authentic products from the master catalog (verified poster images & prices)
  const catalogProducts = getAllCatalogProducts()
    .filter((p) => {
      // Rule: If product image is missing or invalid, or price is 0/missing, do not display
      const hasValidImage = Boolean(p.image && !p.image.includes("placeholder") && !p.image.includes("unsplash"))
      const hasValidPrice = Boolean(p.price && p.price > 0)
      return hasValidImage && hasValidPrice
    })
    .map((p) => {
      const variant = p.variants?.[0]
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand || "NUTRATEIN",
        categoryName: p.category,
        categorySlug: normalizeSlug(p.category),
        basePrice: p.price,
        price: variant?.price ?? p.price,
        mrp: variant?.mrp ?? p.mrp,
        discountPercent: variant?.discount ?? p.discount,
        rating: p.rating,
        reviewCount: p.reviewCount,
        image: p.image || p.posterImage,
        flavor: variant?.flavor ?? p.flavor,
        flavors: p.flavors || (p.flavor ? [p.flavor] : []),
        size: variant?.weight ?? p.weight,
        stock: variant?.stock ?? p.stock,
        isBestSeller: p.badge?.includes("BEST"),
        isNew: p.badge?.includes("NEW") || p.badge?.includes("LEAN"),
        variantId: variant?.id,
        shortDescription: p.tagline,
        variants: p.variants || [],
      }
    })

  // 2. Query DB with safe fast timeout (returns fallback immediately if DB times out or fails)
  let rawDbProducts: any[] = []
  try {
    const dbPromise = prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        variants: { where: { isActive: true }, take: 1, orderBy: { price: "asc" } },
        category: true,
      },
    })
    rawDbProducts = await withFastTimeout(dbPromise, [], 250)
  } catch {
    rawDbProducts = []
  }

  // 3. Process DB products (filter out dummy/missing images and invalid prices)
  const validDbProducts = rawDbProducts
    .filter((p) => {
      const img = p.images?.[0]?.url
      const isMock = !img || img.includes("unsplash") || img.includes("placeholder")
      const isZeroPrice = !p.basePrice || p.basePrice <= 0
      return !isMock && !isZeroPrice
    })
    .map((p) => {
      const variant = p.variants?.[0]
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        categoryName: p.category?.name || "General",
        categorySlug: normalizeSlug(p.category?.slug || p.category?.name),
        basePrice: p.basePrice,
        price: variant?.price ?? p.basePrice,
        mrp: p.mrp,
        discountPercent: p.discountPercent,
        rating: p.rating,
        reviewCount: p.reviewCount,
        image: p.images[0]?.url,
        flavor: variant?.flavor ?? undefined,
        flavors: variant?.flavor ? [variant.flavor] : [],
        size: variant?.size ?? undefined,
        stock: variant?.stock ?? 50,
        isBestSeller: p.isBestSeller,
        isNew: p.isNew,
        variantId: variant?.id,
        shortDescription: p.shortDescription,
        variants: p.variants || [],
      }
    })

  // Combine authentic products (preferring authentic verified catalog)
  const allAvailableProducts =
    validDbProducts.length > 0
      ? [
          ...catalogProducts,
          ...validDbProducts.filter((dbp) => !catalogProducts.some((cp) => cp.slug === dbp.slug)),
        ]
      : catalogProducts

  // 4. Apply Filters
  let filtered = [...allAvailableProducts]

  // Category filter
  if (categorySlug) {
    filtered = filtered.filter((p) => {
      const catSlug = p.categorySlug
      return (
        catSlug === categorySlug ||
        (categorySlug === "gear" && (catSlug.includes("gear") || catSlug.includes("accessories"))) ||
        (catSlug === "gear" && (categorySlug.includes("gear") || categorySlug.includes("accessories"))) ||
        catSlug.includes(categorySlug) ||
        categorySlug.includes(catSlug)
      )
    })
  }

  // Brand filter
  if (brandParam) {
    filtered = filtered.filter(
      (p) => p.brand.toLowerCase() === brandParam.toLowerCase()
    )
  }

  // Price range filter
  if (minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= minPrice)
  }
  if (maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= maxPrice)
  }

  // Flavor filter
  if (flavorParam) {
    const fLower = flavorParam.toLowerCase()
    filtered = filtered.filter((p) => {
      if (p.flavor && p.flavor.toLowerCase().includes(fLower)) return true
      if (p.flavors && p.flavors.some((f: string) => f.toLowerCase().includes(fLower))) return true
      return false
    })
  }

  // In-stock filter
  if (inStock) {
    filtered = filtered.filter((p) => p.stock > 0)
  }

  // 5. Sorting
  if (sort === "price-asc") {
    filtered.sort((a, b) => a.price - b.price)
  } else if (sort === "price-desc") {
    filtered.sort((a, b) => b.price - a.price)
  } else if (sort === "rating") {
    filtered.sort((a, b) => b.rating - a.rating)
  } else if (sort === "discount") {
    filtered.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0))
  } else {
    // "popular"
    filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0))
  }

  // 6. Pagination
  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const paginatedProducts = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Extract distinct flavors for filter sidebar
  const allFlavors = Array.from(
    new Set(allAvailableProducts.flatMap((p) => p.flavors).filter(Boolean))
  ) as string[]

  const brands = Array.from(new Set(allAvailableProducts.map((p) => p.brand).filter(Boolean)))

  // Selected Category Name
  const selectedCategoryObj = AUTHENTIC_CATEGORIES.find((c) => c.slug === categorySlug)
  const categoryTitle = selectedCategoryObj
    ? selectedCategoryObj.name
    : categorySlug
    ? categorySlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "All Fitness Supplements"

  return (
    <div className="bg-zinc-50 py-4 sm:py-8 min-h-[80vh]">
      <div className="container-custom px-3 sm:px-6">
        {/* Breadcrumb & Title */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 text-xs text-dark-400 mb-2">
            <Link href="/" className="hover:text-dark-700">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-dark-700">Shop</Link>
            {categorySlug && (
              <>
                <span>/</span>
                <span className="text-dark-900 font-semibold">{categoryTitle}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-dark-900">{categoryTitle}</h1>
          <p className="text-xs text-dark-500 mt-1">
            {paginatedProducts.length} of {totalCount} products
          </p>
        </div>

        {/* Quick Category Scrollable Chips - Full width on mobile */}
        <div className="mb-4 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 w-max sm:w-auto sm:flex-wrap">
            <Link
              href="/shop"
              className={`badge text-[11px] whitespace-nowrap transition-colors ${
                !categorySlug ? "bg-brand-600 text-white font-bold" : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              All
            </Link>
            {AUTHENTIC_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={"/shop?category=" + c.slug}
                className={`badge text-[11px] whitespace-nowrap transition-colors ${
                  categorySlug === c.slug
                    ? "bg-brand-600 text-white font-bold"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Sidebar Filters — hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <ProductFilters
              categories={AUTHENTIC_CATEGORIES}
              brands={brands}
              flavors={allFlavors}
            />
          </div>

          {/* Product Listing */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Empty State */}
            {paginatedProducts.length === 0 ? (
              <div className="card p-12 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">!</div>
                <h3 className="text-lg font-bold text-dark-900">No products found</h3>
                <p className="text-xs text-dark-500 max-w-sm mx-auto">
                  No verified supplements match the selected filter combination.
                </p>
                <Link href="/shop" className="btn-secondary text-xs inline-flex mt-2">Reset All Filters</Link>
              </div>
            ) : (
              /* Product Grid — 2 cols on mobile, 3 on xl */
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    brand={product.brand}
                    price={product.price}
                    mrp={product.mrp}
                    discountPercent={product.discountPercent}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    image={product.image}
                    flavor={product.flavor}
                    size={product.size}
                    stock={product.stock}
                    isBestSeller={product.isBestSeller}
                    isNew={product.isNew}
                    variantId={product.variantId}
                    shortDescription={product.shortDescription}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4 sm:pt-6">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1
                  const isCurrent = pageNum === page
                  return (
                    <Link
                      key={pageNum}
                      href={"/shop?page=" + pageNum + (categorySlug ? "&category=" + categorySlug : "")}
                      className={
                        "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors " +
                        (isCurrent
                          ? "bg-brand-600 text-white"
                          : "bg-white border border-dark-200 text-dark-700 hover:bg-dark-50")
                      }
                    >
                      {pageNum}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import ProductCard from "@/components/product/ProductCard"
import Link from "next/link"
import { Search } from "lucide-react"

export const dynamic = "force-dynamic"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q?.trim() || ""

  let products: any[] = []
  if (query) {
    products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query } },
          { brand: { contains: query } },
          { description: { contains: query } },
          { tags: { contains: query } },
          { category: { name: { contains: query } } },
        ],
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        variants: { where: { isActive: true }, take: 1, orderBy: { price: "asc" } },
        category: true,
      },
    })
  }

  return (
    <div className="py-10 bg-dark-50/50 min-h-[60vh]">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-xs text-dark-500">
            Found {products.length} product{products.length === 1 ? "" : "s"}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="card p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-dark-100 rounded-full flex items-center justify-center mx-auto">
              <Search size={24} className="text-dark-400" />
            </div>
            <h3 className="font-bold text-dark-900 text-lg">No matching products found</h3>
            <p className="text-xs text-dark-500">
              Try searching for "whey", "creatine", "isolate", or "pre-workout".
            </p>
            <Link href="/shop" className="btn-primary text-xs inline-flex">
              Browse All Products
            </Link>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}

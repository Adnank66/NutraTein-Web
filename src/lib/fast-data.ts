import { getAllCatalogProducts } from "@/data/products-catalog"

/**
 * Executes a promise with an aggressive timeout (default 200ms).
 * If the database connection hangs (e.g. Atlas IP whitelist network block),
 * it returns the fallback value immediately so the storefront never hangs.
 */
export async function withFastTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = 200
): Promise<T> {
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs)
  })

  try {
    const res = await Promise.race([promise, timeoutPromise])
    clearTimeout(timer!)
    return res
  } catch (err) {
    clearTimeout(timer!)
    return fallback
  }
}

/**
 * Returns formatted fallback products from the master catalog
 */
export function getFallbackProducts() {
  const catalog = getAllCatalogProducts()
  return catalog.map((p) => {
    const variant = p.variants[0]
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      price: variant?.price ?? p.price,
      mrp: variant?.mrp ?? p.mrp,
      discountPercent: variant?.discount ?? p.discount,
      rating: p.rating,
      reviewCount: p.reviewCount,
      image: p.image,
      flavor: variant?.flavor ?? p.flavor,
      size: variant?.weight ?? p.weight,
      stock: variant?.stock ?? p.stock,
      isBestSeller: p.badge?.includes("BEST"),
      isNew: p.badge?.includes("NEW") || p.badge?.includes("LEAN"),
      variantId: variant?.id,
      description: p.description,
      shortDescription: p.tagline,
    }
  })
}

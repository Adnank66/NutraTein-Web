import catalogData from "./products-catalog.json"
import { ProductCardItem, ProductVariantItem } from "@/components/ui/3-d-coverflow-carousel"

export interface CatalogVariant {
  id: string
  weight: string
  size: string
  flavor?: string
  servings?: number | string
  price: number
  originalPrice?: number
  mrp?: number
  discount?: number
  stock: number
  sku: string
  status?: string
  image?: string
}

export interface CatalogProduct {
  id: string
  slug: string
  name: string
  posterTitle?: string
  tagline?: string
  brand: string
  category: string
  flavor?: string
  flavors?: string[]
  weight?: string
  description?: string
  image: string
  posterImage: string
  badge?: string
  rating: number
  reviewCount: number
  proteinPerServing?: string
  servings?: string
  stock: number
  stockStatus: string
  price: number
  originalPrice: number
  mrp: number
  discount: number
  variants: CatalogVariant[]
  href: string
}

export interface CatalogData {
  comment: string
  lastUpdated: string
  currency: string
  currencySymbol: string
  products: CatalogProduct[]
}

export const CATALOG: CatalogData = catalogData as CatalogData

/**
 * Get all authentic catalog products
 */
export function getAllCatalogProducts(): CatalogProduct[] {
  return CATALOG.products
}

/**
 * Get catalog products converted to ProductCardItem format for 3D Coverflow Carousel
 */
export function getCoverflowCatalogProducts(): ProductCardItem[] {
  return CATALOG.products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    flavor: p.flavor,
    weight: p.weight,
    description: p.description,
    image: p.image,
    price: p.price,
    originalPrice: p.mrp || p.originalPrice,
    discount: p.discount,
    rating: p.rating,
    reviewCount: p.reviewCount,
    proteinPerServing: p.proteinPerServing,
    servings: p.servings,
    stock: p.stock,
    stockStatus: p.stockStatus,
    badge: p.badge,
    variants: p.variants.map((v) => ({
      id: v.id,
      weight: v.weight,
      size: v.size,
      flavor: v.flavor,
      servings: v.servings,
      price: v.price,
      originalPrice: v.mrp || v.originalPrice,
      mrp: v.mrp,
      discount: v.discount,
      stock: v.stock,
      sku: v.sku,
      status: v.status,
      image: v.image,
    })),
    href: p.href,
  }))
}

/**
 * Find product by slug
 */
export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return CATALOG.products.find((p) => p.slug === slug || p.id === slug)
}

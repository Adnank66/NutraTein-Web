import { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { getAllCatalogProducts } from "@/data/products-catalog"
import { withFastTimeout } from "@/lib/fast-data"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nutratein.in"

  // 1. Core static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/deals`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/track`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/return-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ]

  // 2. Dynamic product routes from database with catalog fallback
  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const dbProducts = await withFastTimeout(
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      [],
      400
    )

    if (dbProducts && dbProducts.length > 0) {
      productRoutes = dbProducts.map((p) => ({
        url: `${baseUrl}/shop/${p.slug}`,
        lastModified: p.updatedAt || new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      }))
    }
  } catch (err) {
    console.warn("Sitemap: Falling back to catalog products", err)
  }

  // If no DB products returned, fallback to catalog
  if (productRoutes.length === 0) {
    const catalog = getAllCatalogProducts()
    productRoutes = catalog.map((p) => ({
      url: `${baseUrl}/shop/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }))
  }

  return [...staticRoutes, ...productRoutes]
}
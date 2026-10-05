import React from "react"
import { prisma } from "@/lib/prisma"
import { ProductCardItem } from "@/components/ui/3-d-coverflow-carousel"
import FeaturedCoverflowClient from "./FeaturedCoverflowClient"
import { withFastTimeout } from "@/lib/fast-data"
import { getCoverflowCatalogProducts } from "@/data/products-catalog"

function resolveLocalProductImage(slug: string = "", categorySlug: string = "", name: string = ""): string {
  const s = `${slug} ${categorySlug} ${name}`.toLowerCase()

  if (s.includes("shred") || s.includes("hydro")) return "/assets/images/SHRED -TEIN wheyyellow.png"
  if (s.includes("whey") || s.includes("isolate") || s.includes("concentrate")) return "/assets/images/SHRED -TEIN wheyred.png"
  if (s.includes("creatine")) return "/assets/images/Createin Monohydrate.jpeg"
  if (s.includes("pre-workout") || s.includes("ignition") || s.includes("pump")) return "/assets/images/PreWorkout.jpeg"
  if (s.includes("mass") || s.includes("gainer") || s.includes("extreme")) return "/assets/images/MASS Tein gainer.jpeg"
  if (s.includes("carnitine")) return "/assets/images/L-canitne.jpeg"
  if (s.includes("dinabol") || s.includes("tablet")) return "/assets/images/Dinabol tablet.jpeg"
  if (s.includes("plant") || s.includes("pea") || s.includes("vegan")) return "/assets/products/plant-protein.jpg"
  if (s.includes("bcaa") || s.includes("eaa") || s.includes("amino")) return "/assets/products/bcaa.jpg"
  if (s.includes("vitamin") || s.includes("omega") || s.includes("zma") || s.includes("collagen")) return "/assets/products/vitamins.jpg"
  if (s.includes("shaker") || s.includes("bottle") || s.includes("glove")) return "/assets/products/shaker.jpg"
  if (s.includes("stack") || s.includes("combo")) return "/assets/products/combo.jpg"

  return "/assets/images/SHRED -TEIN wheyred.png"
}

function resolveNutritionSpecs(catSlug: string = "", name: string = "") {
  const s = `${catSlug} ${name}`.toLowerCase()

  if (s.includes("whey") || s.includes("isolate")) {
    return { protein: "27g Pure Protein", servings: "66 Servings" }
  }
  if (s.includes("creatine")) {
    return { protein: "5g Creapure® Scoop", servings: "83 Servings" }
  }
  if (s.includes("pre-workout") || s.includes("pump")) {
    return { protein: "6000mg L-Citrulline", servings: "30 Servings" }
  }
  if (s.includes("mass") || s.includes("gainer")) {
    return { protein: "52g Heavy Mass Protein", servings: "30 Mega Scoops" }
  }
  if (s.includes("plant") || s.includes("pea")) {
    return { protein: "25g Organic Protein", servings: "30 Servings" }
  }
  if (s.includes("bcaa") || s.includes("eaa")) {
    return { protein: "7g 2:1:1 Vegan BCAAs", servings: "40 Servings" }
  }
  if (s.includes("vitamin") || s.includes("omega")) {
    return { protein: "100% Daily Micronutrients", servings: "60 Softgels" }
  }
  return { protein: "Lab-Tested Grade", servings: "Standard Pack" }
}

export default async function FeaturedCoverflowSection() {
  const fallback = getCoverflowCatalogProducts()

  const products = await withFastTimeout<ProductCardItem[]>(
    (async () => {
      try {
        const dbProducts = await prisma.product.findMany({
          where: { isActive: true },
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            variants: { where: { isActive: true }, orderBy: { price: "asc" } },
            category: true,
          },
          take: 10,
          orderBy: [{ isFeatured: "desc" }, { isBestSeller: "desc" }, { rating: "desc" }],
        })

        if (!dbProducts || dbProducts.length === 0) return fallback

        const mappedDbProducts = dbProducts.map((p) => {
          const variantList = p.variants || []
          const primaryVariant = variantList[0]
          const catSlug = p.category?.slug || "supplements"
          const localImg = resolveLocalProductImage(p.slug, catSlug, p.name)
          const primaryImg = p.images[0]?.url
          const finalImage = (primaryImg && primaryImg.startsWith("/assets/")) ? primaryImg : localImg
          const specs = resolveNutritionSpecs(catSlug, p.name)

          const badge = p.isBestSeller
            ? "BEST SELLER"
            : p.isNew
            ? "NEW FORMULA"
            : p.discountPercent && p.discountPercent > 15
            ? `${p.discountPercent}% OFF`
            : "TOP CHOICE"

          const mappedVariants = variantList.map((v) => ({
            id: v.id,
            weight: v.size || "Standard",
            size: v.size || "Standard",
            flavor: v.flavor || "Natural",
            price: v.price,
            originalPrice: Math.round(v.price * 1.3),
            discount: Math.round(((Math.round(v.price * 1.3) - v.price) / Math.round(v.price * 1.3)) * 100),
            stock: v.stock ?? 50,
            sku: v.sku,
            image: finalImage
          }))

          const stockCount = primaryVariant?.stock ?? 45
          const stockStatus = stockCount === 0 ? "Out of Stock" : stockCount <= 10 ? `Only ${stockCount} left` : "In Stock"

          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            brand: p.brand || "NUTRATEIN",
            category: p.category?.name || "Sports Nutrition",
            flavor: primaryVariant?.flavor || "Double Rich Chocolate",
            weight: primaryVariant?.size || "2 KG / 4.4 LBS",
            description: p.shortDesc || p.description?.slice(0, 110) || "Micro-filtered sports supplement formulated for rapid protein synthesis and maximum recovery.",
            image: finalImage,
            price: primaryVariant?.price ?? p.basePrice,
            originalPrice: p.mrp || Math.round((primaryVariant?.price ?? p.basePrice) * 1.3),
            discount: p.discountPercent || (p.mrp ? Math.round(((p.mrp - (primaryVariant?.price ?? p.basePrice)) / p.mrp) * 100) : 20),
            rating: p.rating || 4.9,
            reviewCount: p.reviewCount || 142,
            proteinPerServing: specs.protein,
            servings: specs.servings,
            stock: stockCount,
            stockStatus,
            badge,
            variants: mappedVariants.length > 0 ? mappedVariants : undefined,
            href: `/shop/${p.slug}`,
          }
        })

        const uniqueDbProducts = Array.from(new Map(mappedDbProducts.map(item => [item.id, item])).values())
        return uniqueDbProducts.length > 0 ? uniqueDbProducts : fallback
      } catch {
        return fallback
      }
    })(),
    fallback,
    200
  )

  return (
    <FeaturedCoverflowClient products={products.length > 0 ? products : fallback} />
  )
}

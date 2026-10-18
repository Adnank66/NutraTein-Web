import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nutratein.in"

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/account/",
        "/api/",
        "/cart",
        "/checkout",
        "/checkout/",
        "/order-confirmation/",
        "/thank-you",
        "/login",
        "/register",
        "/forgot-password",
        "/dropdown-demo",
        "/liquid-metal-demo",
        "/showcase/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
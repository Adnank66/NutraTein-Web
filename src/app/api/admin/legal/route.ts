import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const DEFAULT_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: "Terms & Conditions",
    content: `# Terms & Conditions\n\nLast updated: ${new Date().toLocaleDateString('en-IN')}\n\n## 1. Acceptance\nBy using NUTRATEIN website, you agree to these terms.\n\n## 2. Products\nAll supplements sold are for adults 18+. Consult a physician before use.\n\n## 3. Orders\nOrders are subject to availability. We reserve the right to cancel orders.\n\n## 4. Payment\nPayment must be completed before dispatch. We accept UPI and Cash on Delivery.\n\n## 5. Contact\nFor questions, contact: admin@nutratein.com`,
  },
  privacy: {
    title: "Privacy Policy",
    content: `# Privacy Policy\n\nLast updated: ${new Date().toLocaleDateString('en-IN')}\n\n## What we collect\n- Name, email, phone for order processing\n- Delivery address\n- Payment information (processed securely)\n\n## How we use your data\n- Fulfilling orders\n- Sending order notifications\n- Customer support\n\n## Data sharing\nWe do not sell your personal information.\n\n## Contact\nadmin@nutratein.com`,
  },
  "refund-policy": {
    title: "Refund Policy",
    content: `# Refund Policy\n\n## Returns\nWe accept returns within 7 days of delivery for unopened/damaged items.\n\n## Refund Timeline\nRefunds are processed within 5-7 business days.\n\n## How to initiate\nContact us at admin@nutratein.com with your order number.`,
  },
  "shipping-policy": {
    title: "Shipping Policy",
    content: `# Shipping Policy\n\n## Delivery Timeline\nOrders are dispatched within 1-2 business days. Delivery takes 3-7 days depending on location.\n\n## Free Shipping\nFree shipping on orders above ₹999.\n\n## Tracking\nYou will receive a tracking number once your order is shipped.`,
  },
  "cookie-policy": {
    title: "Cookie Policy",
    content: `# Cookie Policy\n\n## What are cookies\nCookies are small data files stored in your browser.\n\n## Essential cookies\nRequired for the site to function. Cannot be disabled.\n\n## Analytics cookies\nHelp us understand site usage. Can be declined.\n\n## Managing cookies\nYou can manage cookie preferences at any time using the cookie banner.`,
  },
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")

  try {
    if (slug) {
      let page = await (prisma as any).legalPage?.findUnique({ where: { slug } })
      if (!page) {
        const def = DEFAULT_CONTENT[slug]
        if (!def) return NextResponse.json({ error: "Not found" }, { status: 404 })
        page = { slug, ...def, updatedAt: new Date() }
      }
      return NextResponse.json({ success: true, page })
    }

    const slugs = Object.keys(DEFAULT_CONTENT)
    const pages = await Promise.all(slugs.map(async s => {
      try {
        const p = await (prisma as any).legalPage?.findUnique({ where: { slug: s } })
        return p || { slug: s, title: DEFAULT_CONTENT[s].title, updatedAt: null }
      } catch { return { slug: s, title: DEFAULT_CONTENT[s].title, updatedAt: null } }
    }))

    return NextResponse.json({ success: true, pages })
  } catch (err: any) {
    const slugs = Object.keys(DEFAULT_CONTENT)
    const pages = slugs.map(s => ({ slug: s, title: DEFAULT_CONTENT[s].title, updatedAt: null }))
    return NextResponse.json({ success: true, pages, note: "Using defaults" })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { slug, title, content } = await req.json()
  if (!slug || !content) return NextResponse.json({ error: "slug and content required" }, { status: 400 })

  try {
    const page = await (prisma as any).legalPage?.upsert({
      where: { slug },
      update: { title, content, updatedBy: session.user?.email || null },
      create: { slug, title: title || DEFAULT_CONTENT[slug]?.title || slug, content, updatedBy: session.user?.email || null },
    }) || { slug, title, content }
    return NextResponse.json({ success: true, page })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

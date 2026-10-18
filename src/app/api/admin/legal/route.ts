import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/security"

export const dynamic = "force-dynamic"

const DEFAULT_CONTENT: Record<string, { title: string; content: string }> = {
  terms: {
    title: "Terms & Conditions",
    content: `# Terms & Conditions\n\nLast updated: ${new Date().toLocaleDateString('en-IN')}\n\n## 1. Acceptance\nBy using NUTRATEIN website, you agree to these terms.\n\n## 2. Products\nAll supplements sold are for adults 18+. Consult a physician before use.\n\n## 3. Orders\nOrders are subject to availability. We reserve the right to cancel orders.\n\n## 4. Payment\nPayment must be completed before dispatch. We accept UPI and Cash on Delivery.\n\n## 5. Contact\nFor questions or disputes, contact: nutratein@gmail.com`,
  },
  privacy: {
    title: "Privacy Policy",
    content: `# Privacy Policy

**Last updated: ${new Date().toLocaleDateString('en-IN')}**

**Created by: Adnan Kazi | Contact: nutratein@gmail.com**

---

## 1. Introduction

Welcome to **NUTRA TEIN** ("we", "our", "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and protect your personal data when you use our website at **nutratein.in**.

This policy is maintained by **Adnan Kazi**. If you have questions, contact us at **nutratein@gmail.com**.

## 2. Information We Collect

### A. Personal Information You Provide
- **Full Name** – for order delivery and account setup
- **Email Address** – for order confirmations, updates, and support
- **Phone Number** – for delivery coordination and WhatsApp updates
- **Delivery Address** – house/flat number, street, city, state, pincode, country

### B. Order & Payment Information
- Products ordered, variants (flavors, sizes), quantities
- Payment method selected (UPI or Cash on Delivery)
- UPI transaction reference numbers (UTR IDs) — we do NOT store card numbers
- Order totals, discounts applied, and shipping charges

### C. Account & Authentication Data
- Email and cryptographically hashed password (bcrypt)
- Secure HTTP-only session tokens via NextAuth.js

### D. Cookies & Local Storage
- **Essential Cookies**: Maintain your login session
- **Cart Storage**: Your cart is stored locally in your browser (\`nutratein_cart\`)
- **Cookie Consent**: Your preference is stored in \`nutratein_cookie_consent\`
- **Analytics (Optional)**: Google Analytics 4 collects anonymized traffic data only with your consent

## 3. How We Use Your Information
- To process and fulfill your supplement orders
- To send order confirmation emails and dispatch notifications
- To respond to your customer support queries
- To detect and prevent fraudulent orders or account abuse
- To improve our website and product catalog

## 4. Data Sharing

We **never sell or rent** your personal data. We share it only with:
- **Courier/Logistics partners** – to deliver your order (name, phone, address only)
- **Email infrastructure** – to send transactional emails (order confirmed, shipped, etc.)
- **Google Analytics** – anonymized usage data, only if you consent to analytics cookies

## 5. Your Rights

You have the right to:
- **Access** your personal data we hold
- **Correct** inaccurate information
- **Delete** your account and all associated data
- **Opt out** of marketing communications

To exercise any of these rights, email us at **nutratein@gmail.com**.

## 6. Data Security

We use industry-standard security measures including:
- HTTPS/TLS encryption for all data in transit
- Bcrypt password hashing (never plain-text)
- HTTP-only secure session cookies
- MongoDB Atlas with IP whitelisting and encrypted storage

## 7. Data Retention

We retain your order history for up to **3 years** to comply with Indian GST regulations. Account data is deleted within **30 days** of a deletion request.

## 8. Children's Privacy

Our supplements are intended for adults aged **18 and above**. We do not knowingly collect data from minors.

## 9. Changes to This Policy

We may update this policy from time to time. The updated date will always be shown at the top of this page. Continued use of our website after changes means you accept the updated policy.

## 10. Contact Us

For any privacy-related questions or requests:

- **Name**: Adnan Kazi
- **Email**: nutratein@gmail.com
- **Website**: nutratein.in
- **Address**: Kon Gaon, Kalyan West, Mumbai, Maharashtra 421311, India`,
  },
  "refund-policy": {
    title: "Refund Policy",
    content: `# Refund Policy\n\n## Returns\nWe accept returns within 7 days of delivery for unopened/damaged items.\n\n## Refund Timeline\nRefunds are processed within 5-7 business days.\n\n## How to initiate\nContact us at nutratein@gmail.com with your order number.`,
  },
  "shipping-policy": {
    title: "Shipping Policy",
    content: `# Shipping Policy\n\n## Delivery Timeline\nOrders are dispatched within 1-2 business days. Delivery takes 3-7 days depending on location.\n\n## Free Shipping\nFree shipping on orders above ₹999.\n\n## Tracking\nYou will receive a tracking number once your order is shipped.`,
  },
  "cookie-policy": {
    title: "Cookie Policy",
    content: `# Cookie Policy

**Last updated: ${new Date().toLocaleDateString('en-IN')}**

**Contact: nutratein@gmail.com**

---

## 1. What Are Cookies?

Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and session.

## 2. Cookies We Use

### Essential Cookies (Always Active)
These cookies are necessary for the website to function. They cannot be disabled.

| Cookie | Purpose | Duration |
|--------|---------|----------|
| \`next-auth.session-token\` | Keeps you logged in securely | Session |
| \`next-auth.csrf-token\` | Prevents cross-site request forgery | Session |
| \`nutratein_cart\` | Stores your shopping cart items | 7 days |
| \`nutratein_cookie_consent\` | Remembers your cookie preference | 1 year |

### Analytics Cookies (Optional - Requires Consent)
These cookies help us understand how visitors interact with our website.

| Cookie | Purpose | Duration |
|--------|---------|----------|
| \`_ga\` | Google Analytics visitor identifier | 2 years |
| \`_ga_*\` | Google Analytics session tracking | 2 years |

Analytics cookies are **only activated after you click "Accept All"** on our cookie consent banner. If you click "Essential Only", analytics cookies will NOT be loaded.

## 3. Third-Party Cookies

We use Google Analytics 4 (GA4) for website analytics. Google may set their own cookies subject to [Google's Privacy Policy](https://policies.google.com/privacy).

## 4. How to Manage Cookies

### On Our Website
You can update your cookie preferences at any time by clicking the cookie icon at the bottom of the page or visiting your account settings.

### In Your Browser
You can also manage cookies directly in your browser settings:
- **Chrome**: Settings → Privacy and security → Cookies
- **Firefox**: Settings → Privacy & Security → Cookies and Site Data
- **Safari**: Preferences → Privacy → Manage Website Data
- **Edge**: Settings → Cookies and site permissions

> Note: Disabling essential cookies may prevent parts of the website from working correctly.

## 5. Contact

If you have questions about our use of cookies, please contact us:

- **Email**: nutratein@gmail.com
- **Website**: nutratein.in`,
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
  const guard = await requireAdmin()
  if (!guard.authorized) return guard.errorResponse!

  const { slug, title, content } = await req.json()
  if (!slug || !content) return NextResponse.json({ error: "slug and content required" }, { status: 400 })

  try {
    const page = await (prisma as any).legalPage?.upsert({
      where: { slug },
      update: { title, content, updatedBy: guard.user?.email || null },
      create: { slug, title: title || DEFAULT_CONTENT[slug]?.title || slug, content, updatedBy: guard.user?.email || null },
    }) || { slug, title, content }
    return NextResponse.json({ success: true, page })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

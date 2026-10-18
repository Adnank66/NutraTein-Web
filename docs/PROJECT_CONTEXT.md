# NUTRATEIN — Persistent Project Context & Memory

> **Current Branch**: `multilingual-ai`  
> **Repository Root**: `d:\Git Upload\NutraTein-Web`  
> **Last Updated**: October 18, 2026  
> **Build Status**: Verified Clean (`npx tsc --noEmit` exits with 0 errors)

---

## 1. Project Purpose & Current State

NUTRATEIN is a direct-to-consumer (D2C) Indian sports nutrition and fitness supplement e-commerce platform hosted on Hostinger (`nutratein.in`). The platform features a high-performance storefront, an administrative governance portal, automated recurring deliveries (subscriptions), customer loyalty rewards, an AI consultation assistant powered by Google Gemini, and an English-only storefront optimized for rapid loading and Core Web Vitals.

---

## 2. Confirmed Technical Stack

- **Framework**: Next.js 15.5.25 (App Router, Server Actions, Route Handlers)
- **UI & Language**: React 19.2.8, TypeScript 5.9.3, Tailwind CSS 3.4.17
- **Database**: MongoDB Atlas Cluster (Replica Set)
- **Data Access Layer**: Prisma ORM 5.22.0 (`prisma/schema.prisma` with `provider = "mongodb"`)
- **Authentication**: NextAuth.js v5 (Beta 25) with JWT session strategy, bcrypt hashing, and SHA-256 OTPs
- **AI Integration**: Google Generative AI SDK (`@google/generative-ai`), model `gemini-3.1-flash-lite`
- **Email Transport**: Nodemailer 6.10.1 configured with Gmail SMTP (`nutratein@gmail.com`)
- **State Management**: Zustand 5.0 (Cart, Wishlist, Compare, Language)

---

## 3. Important Locations & Entry Points

| Purpose | File / Directory Path |
| :--- | :--- |
| **Prisma Schema (MongoDB)** | [`prisma/schema.prisma`](file:///d:/Git%20Upload/NutraTein-Web/prisma/schema.prisma) |
| **Database Client Singleton** | [`src/lib/prisma.ts`](file:///d:/Git%20Upload/NutraTein-Web/src/lib/prisma.ts) |
| **Authentication Core** | [`src/lib/auth.ts`](file:///d:/Git%20Upload/NutraTein-Web/src/lib/auth.ts) |
| **Security & Access Control** | [`src/lib/security.ts`](file:///d:/Git%20Upload/NutraTein-Web/src/lib/security.ts) |
| **Email Transport Engine** | [`src/lib/sendEmail.ts`](file:///d:/Git%20Upload/NutraTein-Web/src/lib/sendEmail.ts) |
| **Feature Flags Controller** | [`src/lib/feature-flags.ts`](file:///d:/Git%20Upload/NutraTein-Web/src/lib/feature-flags.ts) |
| **Storefront Root Layout** | [`src/app/layout.tsx`](file:///d:/Git%20Upload/NutraTein-Web/src/app/layout.tsx) |
| **Global Header & Navigation** | [`src/components/layout/Header.tsx`](file:///d:/Git%20Upload/NutraTein-Web/src/components/layout/Header.tsx) |
| **Global Footer** | [`src/components/layout/Footer.tsx`](file:///d:/Git%20Upload/NutraTein-Web/src/components/layout/Footer.tsx) |
| **Storefront Homepage** | [`src/app/(store)/page.tsx`](file:///d:/Git%20Upload/NutraTein-Web/src/app/(store)/page.tsx) |
| **Server Checkout Endpoint** | [`src/app/api/checkout/route.ts`](file:///d:/Git%20Upload/NutraTein-Web/src/app/api/checkout/route.ts) |
| **Admin Unified Subscriptions & Loyalty** | [`src/app/admin/subscriptions-loyalty/page.tsx`](file:///d:/Git%20Upload/NutraTein-Web/src/app/admin/subscriptions-loyalty/page.tsx) |
| **Admin Social Links CMS** | [`src/app/admin/social/page.tsx`](file:///d:/Git%20Upload/NutraTein-Web/src/app/admin/social/page.tsx) |
| **Admin Category Redirection** | [`src/app/admin/categories/page.tsx`](file:///d:/Git%20Upload/NutraTein-Web/src/app/admin/categories/page.tsx) |
| **Email & Stock Alert Settings** | [`src/components/admin/EmailSettingsManager.tsx`](file:///d:/Git%20Upload/NutraTein-Web/src/components/admin/EmailSettingsManager.tsx) |

---

## 4. Environment Variables Inventory (Names Only)

The application reads the following environment variable names (values are masked and stored securely in `.env`):

- **Database**: `DATABASE_URL`, `MONGODB_URI`
- **Auth**: `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_URL`, `CRON_SECRET`
- **Application**: `PORT`, `NODE_ENV`, `FRONTEND_URL`, `NEXT_PUBLIC_APP_URL`
- **Admin**: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- **AI**: `GEMINI_API_KEY`
- **Media**: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **SMTP**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_EMAIL`, `SMTP_PASSWORD`, `MAIL_FROM_NAME`, `MAIL_FROM_ADDRESS`, `MAIL_REPLY_TO`

---

## 5. Recently Completed Work (October 2026)

1. **SMTP Configuration & Live Dispatch Verification**:
   - Resolved Google App Password credential mismatch.
   - Synchronized `SMTP_PASS` and `SMTP_PASSWORD` for `nutratein@gmail.com`.
   - Verified live email dispatch to `nutratein@gmail.com` with confirmation Message ID.
2. **Manual Low-Stock Alert Unit Input**:
   - Added manual numeric input field with preset chips (10, 15, 20, 25, 50 units) and slider in `EmailSettingsManager.tsx`.
   - Automated email dispatch triggers when variant inventory drops $\le$ the configured number.
3. **Social Media Links CMS**:
   - Seeded active brand channels (YouTube, Facebook, Videos, Instagram) in MongoDB Atlas.
   - Built full management interface with live URL testing and active status toggling.
4. **Merged Subscriptions & Loyalty Rewards with Feature Toggles**:
   - Merged `/admin/subscriptions` and `/admin/loyalty` into a unified management hub (`/admin/subscriptions-loyalty`).
   - Added independent master feature toggles that immediately hide/show Subscriptions and Loyalty Rewards on customer navigation and account pages.
5. **Category Manager Redirection**:
   - Linked category cards in `/admin/categories` directly to live storefront shop filters (`/shop?category=${slug}`).
6. **Navbar Contact Information**:
   - Added interactive direct support popover on desktop nav and support card in mobile drawer showing `nutratein@gmail.com` and `+91 7030407080`.
   - Global cleanup: zero occurrences of `adnankazi275@gmail.com` remain in any code or configs.

---

## 6. Files Requiring Extra Caution

- **[`prisma/schema.prisma`](file:///d:/Git%20Upload/NutraTein-Web/prisma/schema.prisma)**: Contains the single source of truth for the database. Never run `prisma db push` or modify model names without authorization.
- **[`src/lib/auth.ts`](file:///d:/Git%20Upload/NutraTein-Web/src/lib/auth.ts)**: Handles all authentication, JWT creation, and OTP validation. Edits could lock users or admins out.
- **[`src/lib/security.ts`](file:///d:/Git%20Upload/NutraTein-Web/src/lib/security.ts)**: Implements `requireUser()`, `requireAdmin()`, and `requireCronSecret()`. Any regression creates access control vulnerabilities.
- **[`src/app/api/checkout/route.ts`](file:///d:/Git%20Upload/NutraTein-Web/src/app/api/checkout/route.ts)**: Core financial transaction logic. Computes order totals, decrements stock, verifies coupons, and triggers alerts.

---

## 7. Current Outstanding Tasks & Next Recommended Steps

1. **Automated Payment Gateway Credentials**: Integrate production merchant keys for Razorpay / Cashfree when ready to replace manual UPI QR verification.
2. **Production Hostinger Deployment Check**: Confirm all environment variables are populated in the Hostinger Node.js Application Manager / VPS before final DNS switch to `nutratein.in`.

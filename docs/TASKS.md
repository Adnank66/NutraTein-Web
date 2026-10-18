# NUTRATEIN — Task & Progress Tracker

> **Active Sprint**: Production Launch & Hosting Readiness  
> **Last Synchronized**: October 18, 2026  
> **Branch**: `multilingual-ai`

---

## 1. Task Summary Dashboard

| Status | Count | Description |
| :--- | :--- | :--- |
| **Done** | 12 | Implemented, verified, and passing type checks. |
| **In Progress** | 1 | Currently active work item. |
| **Ready** | 3 | Fully specified and unblocked for execution. |
| **Backlog** | 4 | Planned future enhancements. |

---

## 2. Master Tasks List

### Completed Tasks (Verified & Closed)

#### [TASK-001] Security Access Control & IDOR Hardening
- **Priority**: P0 (Critical) | **Status**: **Done** | **Completed Date**: Oct 14, 2026
- **Files**: `src/lib/security.ts`, `src/app/api/orders/*`, `src/app/api/subscriptions/*`, `src/app/api/user/*`
- **Description**: Replaced bare-ID database lookups with server session user ID filtering across all customer endpoints. Implemented canonical `requireUser()` and `requireAdmin()` guards.
- **Verification**: `docs/SECURITY_MANUAL_TEST_PLAN.md` test passes with HTTP 401/403 responses.

#### [TASK-002] Server-Side Financial Calculations at Checkout
- **Priority**: P0 (Critical) | **Status**: **Done** | **Completed Date**: Oct 14, 2026
- **Files**: `src/app/api/checkout/route.ts`
- **Description**: Eliminated client-trusted prices and totals. All prices, coupon discounts, shipping costs (₹999 free threshold), and stock levels are computed strictly on the server from MongoDB Atlas.
- **Verification**: Tested checkout tampering payloads; requests with tampered client prices are rejected or overwritten with authoritative database pricing.

#### [TASK-003] Multi-Language Localization Engine
- **Priority**: P1 (High) | **Status**: **Done** | **Completed Date**: Oct 15, 2026
- **Files**: `src/locales/en.json`, `src/locales/hi.json`, `src/locales/mr.json`, `src/locales/ta.json`, `src/components/layout/LanguageSwitcher.tsx`, `src/store/language.ts`
- **Description**: Added full static pre-translated JSON files for English, Hindi, Marathi, and Tamil. Loaded lazily with zero runtime API latency.
- **Verification**: Tested language switcher on homepage; verified translation dictionary coverage without page reload crashes.

#### [TASK-004] AI Chatbot Upgrade with Database Tool Calling
- **Priority**: P1 (High) | **Status**: **Done** | **Completed Date**: Oct 16, 2026
- **Files**: `src/app/api/ai/chat/route.ts`, `src/lib/ai-tools.ts`, `src/components/chat/AiWhatsAppChatWidget.tsx`
- **Description**: Upgraded customer support assistant to Gemini 3.1 Flash-Lite with tools (`searchProducts`, `getProductById`, `getOrderStatus`, `getActiveCoupons`). Enforced 20 calls/hour rate limiting.
- **Verification**: Tested tool calling responses for catalog queries and coupon lookups.

#### [TASK-005] Admin Low-Stock Depletion Alert with Manual Numeric Threshold
- **Priority**: P0 (Critical) | **Status**: **Done** | **Completed Date**: Oct 18, 2026
- **Files**: `src/components/admin/EmailSettingsManager.tsx`, `src/app/api/admin/email-settings/route.ts`, `src/app/api/checkout/route.ts`
- **Description**: Added a manual numeric input field for the inventory low-stock alert threshold (default 25 units) with quick preset chips (10, 15, 20, 25, 50 units) and range slider. Persists in `data/email-settings.json`.
- **Verification**: Tested API GET and POST persistence and verified threshold loading on mount.

#### [TASK-006] Social Media Links Admin CMS
- **Priority**: P1 (Medium) | **Status**: **Done** | **Completed Date**: Oct 18, 2026
- **Files**: `src/app/admin/social/page.tsx`, `src/app/api/admin/social/route.ts`
- **Description**: Created a management interface displaying active brand channels (YouTube, Facebook, Videos, Instagram) with quick platform pills, inline edit controls, and active/inactive status toggles.
- **Verification**: Seeded default channels in MongoDB Atlas, verified GET/POST/PUT mutations and tested live channel links.

#### [TASK-007] Merged Subscriptions & Loyalty Rewards with Feature Toggles
- **Priority**: P0 (High) | **Status**: **Done** | **Completed Date**: Oct 18, 2026
- **Files**: `src/app/admin/subscriptions-loyalty/page.tsx`, `src/app/api/admin/subscriptions-loyalty/route.ts`, `src/lib/feature-flags.ts`, `src/app/account/layout.tsx`, `src/components/admin/AdminSidebar.tsx`
- **Description**: Merged `/admin/subscriptions` and `/admin/loyalty` into a single unified page with independent ON/OFF master toggles. When toggled OFF, Subscriptions and Loyalty Rewards are automatically hidden from customer storefront navigation and account pages.
- **Verification**: Tested toggle switches; confirmed customer menu items conditionally hide and show; confirmed `/admin/subscriptions` and `/admin/loyalty` redirect cleanly.

#### [TASK-008] Admin Category Manager Direct Redirection
- **Priority**: P1 (Medium) | **Status**: **Done** | **Completed Date**: Oct 18, 2026
- **Files**: `src/app/admin/categories/page.tsx`
- **Description**: Wrapped category cards (name, icon, slug) in external links pointing to `/shop?category=${c.slug}` with open-in-new-tab icons.
- **Verification**: Verified category clicks open the corresponding filtered shop page.

#### [TASK-009] Global Email Replacement to `nutratein@gmail.com`
- **Priority**: P0 (Critical) | **Status**: **Done** | **Completed Date**: Oct 18, 2026
- **Files**: `src/components/layout/Header.tsx`, `src/app/contact/page.tsx`, `src/data/store-settings.json`, `AUDIT_REPORT.md`
- **Description**: Replaced all occurrences of `adnankazi275@gmail.com` across the codebase with `nutratein@gmail.com` and phone `+91 877 906 0033`. Added support popover on desktop nav and support card in mobile drawer.
- **Verification**: Executed `git grep -i "adnankazi275"`; confirmed 0 occurrences remain in any active code, configs, or templates.

#### [TASK-010] SMTP Configuration & Live Verification for `nutratein@gmail.com`
- **Priority**: P0 (Critical) | **Status**: **Done** | **Completed Date**: Oct 18, 2026
- **Files**: `.env`, `src/lib/sendEmail.ts`, `lib/sendEmail.ts`
- **Description**: Identified Google App Password account mismatch in `.env`. Synchronized `SMTP_PASS` and `SMTP_PASSWORD`. Added flexible port 587 STARTTLS and port 465 SSL handling with connection timeouts.
- **Verification**: Dispatched live verification email directly to `nutratein@gmail.com` via Google SMTP (`Message ID: <09251761-f404-bd6b-df43-42665ae80759@gmail.com>`).

#### [TASK-011] Packaging Image Display & Crop Elimination
- **Priority**: P0 (High) | **Status**: **Done** | **Completed Date**: Oct 17, 2026
- **Files**: `src/components/product/ProductCard.tsx`, `src/components/product/ProductGallery.tsx`, `src/components/product/QuickViewModal.tsx`
- **Description**: Fixed supplement image cropping across product cards, quick view modals, and cart drawers by enforcing `object-contain` and padded square containers.
- **Verification**: Inspected product cards across Whey Protein, Creatine, and Mass Gainers; packaging labels display fully without clipping.

#### [TASK-012] TypeScript 0-Error Baseline
- **Priority**: P0 (Critical) | **Status**: **Done** | **Completed Date**: Oct 18, 2026
- **Files**: All files across `src/` and `prisma/`
- **Description**: Resolved all TypeScript type mismatches (including Prisma model orderBy properties).
- **Verification**: `npx tsc --noEmit` exits with **0 errors**.

---

### In Progress & Active Tasks

#### [TASK-013] Master Project Documentation & AI Context System
- **Priority**: P0 (Critical) | **Status**: **In Progress** | **Target Date**: Oct 18, 2026
- **Files**: `AGENTS.md`, `.antigravity/rules.md`, `README.md`, `docs/*`
- **Description**: Build a complete, maintainable 10-document documentation system to ensure future AI sessions preserve stack, architecture, design tokens, and progress without inventing requirements.
- **Acceptance Criteria**: All 10 documents created in `docs/`, `AGENTS.md` and `.antigravity/rules.md` present, stack matches source code, no secrets added, `tsc --noEmit` clean.

---

### Ready for Next Action

#### [TASK-014] Pre-Hosting Production Verification Run
- **Priority**: P1 (High) | **Status**: **Ready**
- **Files**: `next.config.js`, `package.json`, `.env.example`
- **Description**: Run full production build (`npm run build`) and test all core storefront and admin routes under production bundle conditions before final Hostinger deployment.
- **Acceptance Criteria**: `next build` generates static and dynamic routes with 0 build errors.

#### [TASK-015] Payment Gateway Live Merchant Keys Integration
- **Priority**: P1 (High) | **Status**: **Ready**
- **Files**: `src/app/api/checkout/route.ts`, `src/components/checkout/CheckoutPaymentForm.tsx`
- **Description**: If automated Razorpay/Cashfree payment capture is desired in place of manual UPI QR confirmation, add production API credentials in `.env` and verify webhook signature verification.
- **Dependencies**: Merchant onboarding on Razorpay/Cashfree.

#### [TASK-016] Production Hostinger Environment Variables Sync
- **Priority**: P1 (High) | **Status**: **Ready**
- **Files**: Hostinger Node.js Application Manager / VPS Settings
- **Description**: Verify that all required environment variable names from `docs/TESTING_AND_DEPLOYMENT.md` are added to the Hostinger Environment Variables console before pointing DNS for `nutratein.in`.

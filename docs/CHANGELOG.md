# NUTRATEIN — Project Change History (Changelog)

> All notable changes, architectural decisions, security hardenings, and feature additions to the NUTRATEIN platform are documented in this file.

---

## [2.0.0] — 2026-10-18

### 1. Unified Subscriptions & Loyalty Rewards Control Center
- **Summary**: Merged separate `/admin/subscriptions` and `/admin/loyalty` management into a single, cohesive hub (`/admin/subscriptions-loyalty`) with independent ON/OFF master toggles for storefront visibility.
- **Affected Files**:
  - `src/app/admin/subscriptions-loyalty/page.tsx`
  - `src/app/api/admin/subscriptions-loyalty/route.ts`
  - `src/lib/feature-flags.ts`
  - `src/data/feature-flags.json`
  - `src/app/account/layout.tsx`
  - `src/app/account/subscriptions/page.tsx`
  - `src/app/account/rewards/page.tsx`
  - `src/components/admin/AdminSidebar.tsx`
- **Reason**: Simplifies store administration and gives the merchant complete control over whether customers can see and use recurring subscriptions and loyalty points on the live storefront.
- **Requirement / Task IDs**: `PRD-012`, `PRD-013`, `PRD-014`, `TASK-007`
- **Tests Performed**: Tested toggle switching; verified customer account navigation dynamically filters out items; verified direct URL visits show friendly inactive notices; verified Next.js redirects from old routes.

### 2. Manual Low-Stock Depletion Alert Threshold
- **Summary**: Upgraded stock alert settings in the admin panel to allow manual numeric input of unit threshold (default 25 units) with quick preset chips (10, 15, 20, 25, 50 units) and range slider.
- **Affected Files**:
  - `src/components/admin/EmailSettingsManager.tsx`
  - `src/app/api/admin/email-settings/route.ts`
  - `src/app/api/checkout/route.ts`
- **Reason**: Enables store managers to set custom inventory alert points per operational strategy.
- **Requirement / Task IDs**: `PRD-020`, `TASK-005`
- **Tests Performed**: Verified GET and POST persistence in `data/email-settings.json`; verified numeric boundary validation.

### 3. Social Media Links Admin Manager
- **Summary**: Added an administrative interface to view, edit, add, and toggle brand social channels (YouTube, Facebook, Videos, Instagram) with database persistence.
- **Affected Files**:
  - `src/app/admin/social/page.tsx`
  - `src/app/api/admin/social/route.ts`
- **Reason**: Allows the merchant to manage all external brand channel links dynamically without touching code.
- **Requirement / Task IDs**: `PRD-022`, `TASK-006`
- **Tests Performed**: Auto-seeded channels in MongoDB Atlas; verified live link navigation; verified active status toggles.

### 4. Admin Category Manager Direct Redirection
- **Summary**: Converted category cards in the admin category manager into clickable links that redirect directly to the storefront filtered shop page (`/shop?category=${slug}`).
- **Affected Files**:
  - `src/app/admin/categories/page.tsx`
- **Reason**: Allows the admin to immediately inspect how each category renders on the live storefront.
- **Requirement / Task IDs**: `PRD-021`, `TASK-008`
- **Tests Performed**: Clicked category cards and confirmed redirection to storefront shop category view in a new tab.

### 5. SMTP Configuration & Verification for `nutratein@gmail.com`
- **Summary**: Replaced all previous email references with `nutratein@gmail.com` and phone `+91 877 906 0033`. Synchronized Google App Password in `.env`. Added support popover to desktop nav and support card in mobile drawer. Verified live dispatch.
- **Affected Files**:
  - `.env`
  - `src/lib/sendEmail.ts`
  - `lib/sendEmail.ts`
  - `src/components/layout/Header.tsx`
  - `src/app/contact/page.tsx`
  - `AUDIT_REPORT.md`
- **Reason**: Establishes `nutratein@gmail.com` as the official corporate contact and notification dispatch account.
- **Requirement / Task IDs**: `PRD-009`, `PRD-020`, `TASK-009`, `TASK-010`
- **Tests Performed**: Dispatched live verification email directly to `nutratein@gmail.com`; Google SMTP confirmed delivery with Message ID `<09251761-f404-bd6b-df43-42665ae80759@gmail.com>`.

### 6. Master Project Documentation & AI Context System
- **Summary**: Created the master documentation architecture (`AGENTS.md`, `.antigravity/rules.md`, and 10 detailed documents in `docs/`).
- **Affected Files**:
  - `AGENTS.md`
  - `.antigravity/rules.md`
  - `docs/PRD.md`
  - `docs/ARCHITECTURE.md`
  - `docs/DESIGN_SYSTEM.md`
  - `docs/PROJECT_CONTEXT.md`
  - `docs/CODING_RULES.md`
  - `docs/TASKS.md`
  - `docs/API_REFERENCE.md`
  - `docs/DATABASE_SCHEMA.md`
  - `docs/TESTING_AND_DEPLOYMENT.md`
  - `docs/CHANGELOG.md`
  - `README.md`
- **Reason**: Ensures future AI coding sessions have persistent, accurate architectural context, design tokens, coding standards, and progress records without guessing.
- **Requirement / Task IDs**: `TASK-013`
- **Tests Performed**: Validated cross-references; confirmed zero TypeScript errors via `npx tsc --noEmit`.

### 7. Official Brand Logo, Webflow-Style Preloader, Hostinger Platform Transition & English-Only Storefront
- **Summary**:
  1. **New Logo Asset Integration**: Integrated transparent-background PNG logo (`frontend/assets/logos/nutratein logo.png`) copied to `public/assets/logos/nutratein-logo.png` and `public/nutratein-logo.png`. Deployed across Header (desktop & mobile), Footer (with `invert brightness-200` for dark surface), Admin Sidebar (desktop & mobile), Auth pages (Login, Register, Forgot Password), Admin Direct Login, and Invoice generation modal.
  2. **Banner Animation Preloader**: Upgraded `src/components/ui/NutraTeinLoader.tsx` with the Webflow-style smooth expo loader (`cubic-bezier(0.87, 0, 0.13, 1)`) from `frontend/new banner animation.html`. Features a clean white backdrop, dual-layer logo container (`aspect-ratio: 302/142`), 14% opacity base outline, dynamic rising solid logo fill via `clip-path: inset(${100 - progress}% 0 0 0)`, 400ms completion pause, smooth 1.2s slide-up exit (`translateY(-100vh)`), and unmount cleanup.
  3. **Hostinger Hosting Configuration**: Removed all Vercel references from `.env`, `.gitignore`, `README.md`, `NUTRATEIN_AI_REPORT.md`, `backend/server.js`, and documentation. Updated `docs/TESTING_AND_DEPLOYMENT.md` with complete Hostinger Node.js Application (hPanel) and Hostinger Cloud/VPS (PM2 + Nginx) deployment guide.
  4. **English-Only Storefront**: Deactivated language-switching UI across Header, user account menu, and mobile navigation. Locked Zustand language store to strictly `"en"` with automatic cleanup of legacy language cookies to ensure fast, consistent English-only rendering.
- **Affected Files**:
  - `public/assets/logos/nutratein-logo.png`
  - `public/nutratein-logo.png`
  - `src/components/ui/NutraTeinLoader.tsx`
  - `src/app/layout.tsx`
  - `src/components/layout/Header.tsx`
  - `src/components/layout/Footer.tsx`
  - `src/components/admin/AdminSidebar.tsx`
  - `src/components/admin/AdminDirectLogin.tsx`
  - `src/app/(auth)/login/page.tsx`
  - `src/app/(auth)/register/page.tsx`
  - `src/app/(auth)/forgot-password/page.tsx`
  - `src/components/order/InvoiceModal.tsx`
  - `src/components/layout/LanguageSwitcher.tsx`
  - `src/store/language.ts`
  - `.env`
  - `.gitignore`
  - `README.md`
  - `docs/TESTING_AND_DEPLOYMENT.md`
  - `docs/ARCHITECTURE.md`
  - `docs/PROJECT_CONTEXT.md`
  - `docs/PRD.md`
  - `docs/TASKS.md`
- **Tests Performed**: Verified compilation with `npx tsc --noEmit` (code 0, zero errors).

---

## [1.5.0] — 2026-10-14 to 2026-10-17

### 1. Multi-Language Localization Engine
- Added static pre-translated JSON dictionaries for English (`en.json`), Hindi (`hi.json`), Marathi (`mr.json`), and Tamil (`ta.json`).
- Added persistent language selector in global header and mobile drawer. Zero runtime translation API latency.

### 2. AI Customer Assistant Upgrade
- Upgraded chatbot to Gemini 3.1 Flash-Lite with tools for real-time database queries (search products, fetch order status, active coupons).
- Enforced rate limit of 20 queries/hour per user or IP.

### 3. Comprehensive Security Pass (Pass 1 & Pass 2)
- Enforced server-side session user ID filtering across all customer endpoints to prevent IDOR vulnerabilities.
- Removed client-trusted pricing at checkout; recomputed item totals, coupons, and stock reservation on the server.
- Built reusable guards: `requireUser()`, `requireAdmin()`, `requireCronSecret()`.

### 4. Image Display & Cropping Fixes
- Enforced `object-contain` and padded square containers on product packaging renders to eliminate label cropping.

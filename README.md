# NUTRATEIN — Premium Sports Nutrition & Fitness Supplement E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5.25-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-7.x-47A248?logo=mongodb)](https://www.mongodb.com/)
[![NextAuth](https://img.shields.io/badge/NextAuth.js-v5_Beta-purple?logo=nextdotjs)](https://authjs.dev/)

> **Live Production Target**: [`https://nutratein.in`](https://nutratein.in)  
> **Brand**: NUTRATEIN ("Clean Nutrition, Pure Strength")  
> **Headquarters**: Kalyan West, Mumbai, Maharashtra, India

---

## 🌟 Executive Overview

**NUTRATEIN** is a full-stack, direct-to-consumer (D2C) e-commerce web platform engineered for high-performance sports nutrition, fitness supplements, and wellness essentials. Built on **Next.js 15 (App Router)** and **MongoDB Atlas** via **Prisma ORM**, the platform delivers an athletic, laboratory-grade customer shopping experience, complete with multilingual accessibility (English, Hindi, Marathi, Tamil), AI-powered supplement consultation via Google Gemini, recurring auto-delivery subscriptions, customer loyalty rewards, and a comprehensive administrative management console.

---

## 📚 Master Documentation System

Comprehensive technical documentation is maintained in the [`docs/`](file:///d:/Git%20Upload/NutraTein-Web/docs) directory:

| Document | Purpose | Key Contents |
| :--- | :--- | :--- |
| **[`AGENTS.md`](file:///d:/Git%20Upload/NutraTein-Web/AGENTS.md)** | AI Agent Operating Manual | Mandatory reading order, rules, and guardrails for coding sessions. |
| **[`.antigravity/rules.md`](file:///d:/Git%20Upload/NutraTein-Web/.antigravity/rules.md)** | Workspace Rules | Core workspace constraints, stack lock, and security standards. |
| **[`docs/PRD.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/PRD.md)** | Product Requirements Document | User personas, 25+ functional requirements, acceptance criteria. |
| **[`docs/ARCHITECTURE.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/ARCHITECTURE.md)** | Technical Architecture | System diagrams, data flows, stack details, and legacy resolution. |
| **[`docs/DESIGN_SYSTEM.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/DESIGN_SYSTEM.md)** | Design System & UI Standards | Color palette, typography, button variants, and packaging image rules. |
| **[`docs/PROJECT_CONTEXT.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/PROJECT_CONTEXT.md)** | Persistent Project Memory | Confirmed stack, API routes, active state, and files of caution. |
| **[`docs/CODING_RULES.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/CODING_RULES.md)** | Non-Negotiable Rules | Stack preservation, zero secret leaks, and safe modification lifecycle. |
| **[`docs/TASKS.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/TASKS.md)** | Task Tracker | Structured sprint progress, completed work, and upcoming tasks. |
| **[`docs/API_REFERENCE.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/API_REFERENCE.md)** | API Endpoints Manual | Complete specification for 60+ route handlers and security guards. |
| **[`docs/DATABASE_SCHEMA.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/DATABASE_SCHEMA.md)** | Database Schema Manual | 31 Prisma models, attributes, relations, and indexes in MongoDB Atlas. |
| **[`docs/TESTING_AND_DEPLOYMENT.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/TESTING_AND_DEPLOYMENT.md)** | Deployment Manual | Local setup, environment variables, Hostinger Node.js / VPS configuration, troubleshooting. |
| **[`docs/CHANGELOG.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/CHANGELOG.md)** | Chronological Changelog | Verified history of security passes, features, and releases. |

---

## ⚡ Core Features

### 🛒 Customer Storefront
- **Comprehensive Homepage**: 3D Coverflow carousel, Hero advertisement banners, Best Sellers, Product Comparison, Daily Protein Intake Calculator, Custom Combo Builder, Testimonials, and Trust Certification strip.
- **Dynamic Catalog**: Filterable catalog by categories (Whey Protein, Creatine, Mass Gainers, Vitamins), fitness goals (Muscle Building, Endurance, Recovery), price, and ratings.
- **Product Details (`/shop/[slug]`)**: Packaging image viewer (`object-contain`), interactive variant selectors (flavors and container sizes), nutritional breakdowns, and customer reviews.
- **Slide-Out Cart Drawer**: Real-time quantity adjustments, free shipping progress tracker (free shipping over ₹999), and coupon discount previews.
- **Server-Verified Checkout**: Server-computed prices, stock deduction, coupon validation, dynamic UPI QR payments, and Cash on Delivery (COD).
- **Self-Service Order Tracking (`/track`)**: 5-stage shipment timeline with printable tax invoice (PDF).
- **High-Performance Storefront**: Clean, English-only rendering optimized for Core Web Vitals, Webflow-style logo preloader, and rapid hydration.
- **AI Customer Assistant**: Floating Gemini 3.1 Flash-Lite advisor with real-time database tool calling.

### 🔐 Administrative Management Console (`/admin/*`)
- **Subscriptions & Loyalty**: Unified control center to manage recurring orders, points earning/redemption rules, and master storefront visibility toggles.
- **Product & Inventory Manager**: Live inline stock editing, variant configurations, and automated email alerts to `nutratein@gmail.com` when inventory drops $\le$ threshold.
- **Order Fulfillment Center**: Fulfillment workflow management (`PLACED` $\to$ `CONFIRMED` $\to$ `PROCESSING` $\to$ `SHIPPED` $\to$ `DELIVERED`), invoice printing, and CSV export.
- **Marketing & CMS**: Hero Banners CMS, Promo Coupon Manager, Combo Stacks Manager, Athlete Video Showcase, and Social Media Links Manager.
- **Security & Governance**: Immutable audit logs of administrative actions, staff role permissions, and database backup exports.

---

## 🛠️ Technology Stack & Architecture

- **Application Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Frontend Engine**: [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com/)
- **Active Database**: [MongoDB Atlas](https://www.mongodb.com/) via [Prisma ORM 5.22](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5 (Beta 25)](https://authjs.dev/) with JWT session strategy
- **Email Dispatch**: [Nodemailer](https://nodemailer.com/) with Gmail SMTP (`nutratein@gmail.com`)
- **AI Engine**: [Google Generative AI (Gemini 3.1 Flash-Lite)](https://ai.google.dev/)
- **State Management**: [Zustand 5](https://github.com/pmndrs/zustand)
- **Deployment Platform**: [Hostinger](https://www.hostinger.com/) (Node.js Application / VPS)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.18.0` or higher
- **MongoDB Atlas**: Active cluster connection string

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/nutratein/NutraTein-Web.git
cd NutraTein-Web

# Install dependencies
npm install

# Generate Prisma Client bindings
npx prisma generate
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and populate your credentials:
```bash
cp .env.example .env
```
*(See [`docs/TESTING_AND_DEPLOYMENT.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/TESTING_AND_DEPLOYMENT.md) for complete environment variable specifications).*

### 4. Running the Development Server
```bash
# Start Next.js local server on http://localhost:3000
npm run dev

# Or start on 0.0.0.0 for LAN & mobile testing
npm run dev:mobile
```

### 5. Verification & Testing
```bash
# Run TypeScript compilation check (Must pass with 0 errors)
npx tsc --noEmit

# Run Next.js production build simulation
npm run build
```

---

## 🔒 Security & Safe Engineering Rules

1. **Stack Lock**: The active database is **MongoDB Atlas** via **Prisma ORM**. Do not migrate to Supabase, PostgreSQL, or Mongoose.
2. **Secrets Protection**: Never print real secrets in chat, pull requests, or commits. Always mask credentials.
3. **Server-Side Validation**: Never trust prices or stock counts from client requests. All amounts are computed on the server.
4. **Access Control**: All customer routes use `requireUser()`; all administrative endpoints use `requireAdmin()`.
5. **Image Rules**: Product packaging images must always use `object-contain` inside padded square containers to prevent label cropping.

For full engineering rules, refer to **[`docs/CODING_RULES.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/CODING_RULES.md)** and **[`AGENTS.md`](file:///d:/Git%20Upload/NutraTein-Web/AGENTS.md)**.

---

## 📞 Support & Contacts

- **Email Support**: `nutratein@gmail.com`
- **Phone Support**: `+91 877 906 0033`
- **Headquarters**: Kon Gaon, Kalyan West, Mumbai, Maharashtra 421311, India
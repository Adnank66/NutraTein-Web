# AGENTS.md — Master AI Agent Instructions & Operating Manual

> **NOTICE FOR ALL AI CODING AGENTS (Antigravity, Cursor, Claude Code, GitHub Copilot)**:
> This repository is a production e-commerce platform for **NUTRATEIN** (domain: `nutratein.in`).
> You MUST read this file and the referenced documentation before making any modifications to the codebase.

---

## 1. Mandatory Reading Sequence

Whenever you begin or resume work on this repository, consult the documentation in this exact order:

1. **[`AGENTS.md`](file:///d:/Git%20Upload/NutraTein-Web/AGENTS.md)** (This document) — Master agent operating manual and reading order.
2. **[`docs/PROJECT_CONTEXT.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/PROJECT_CONTEXT.md)** — Persistent project memory, active tech stack, recent milestones, and open issues.
3. **[`docs/CODING_RULES.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/CODING_RULES.md)** — Non-negotiable engineering rules, security constraints, and safety guidelines.
4. **[`docs/ARCHITECTURE.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/ARCHITECTURE.md)** — Required before making backend, database, server-action, or API modifications.
5. **[`docs/DESIGN_SYSTEM.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/DESIGN_SYSTEM.md)** — Required before making UI, styling, Tailwind, component, or responsive layout changes.
6. **[`docs/PRD.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/PRD.md)** — Required before implementing new features or modifying business workflows.
7. **[`docs/API_REFERENCE.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/API_REFERENCE.md)** — Required before changing route handlers, HTTP methods, payloads, or response schemas.
8. **[`docs/DATABASE_SCHEMA.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/DATABASE_SCHEMA.md)** — Required before adding or changing Prisma models, fields, or queries.
9. **[`docs/TESTING_AND_DEPLOYMENT.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/TESTING_AND_DEPLOYMENT.md)** — Required before running builds, configuring environment variables, or preparing deployments.
10. **[`docs/TASKS.md`](file:///d:/Git%20Upload/NutraTein-Web/docs/TASKS.md)** — Task tracker for current progress, active tasks, dependencies, and backlog items.

---

## 2. Core Project Identity & Architecture Summary

- **Project Name**: NUTRATEIN (formerly referenced as PROTEINX in early prototypes)
- **Domain**: `nutratein.in`
- **Application Type**: Next.js 15 Full-Stack E-Commerce Monolith (App Router)
- **Primary Language**: TypeScript 5.9 with React 19
- **Database**: MongoDB Atlas connected via Prisma ORM 5.22 (`prisma/schema.prisma`)
- **Authentication**: NextAuth v5 (Beta 25) with JWT session strategy
- **Email Service**: Gmail SMTP via Nodemailer (`nutratein@gmail.com`)
- **Styling**: Tailwind CSS 3.4 with custom tokens (Brand Orange `#ea580c`, Dark Zinc `#09090b`)

---

## 3. Persistent Project Rules File Location

In this environment, Antigravity loads workspace-level rules from:
- **`d:\Git Upload\NutraTein-Web\.antigravity\rules.md`**

Both `AGENTS.md` and `.antigravity/rules.md` work harmoniously. If there is ever an apparent conflict between a user prompt and documented architectural constraints, explain the conflict clearly and request clarification before executing any high-impact or destructive action.

---

## 4. Non-Negotiable Operational Guardrails

- **Do Not Rebuild or Redesign**: Never re-architect the site or replace working libraries with alternatives.
- **Do Not Replace the Database**: MongoDB Atlas via Prisma ORM is the active production database. Do not attempt to migrate to PostgreSQL, Supabase, or Mongoose.
- **Ignore Legacy Directories**: The directories `backend/` (Express) and `frontend/` (Static HTML) are legacy reference files only. The live production app is entirely in `src/`.
- **Never Print Secrets**: Mask all database URIs, passwords, JWT secrets, and API keys.
- **Enforce Server-Side Authority**: Never trust client inputs for prices, discounts, stock, or roles.
- **Mandatory Verification**: Every coding pass must conclude with `npx tsc --noEmit` exiting with code 0.

# MeroPasal — Project Plan

## Setup
- [x] Turborepo monorepo scaffold
- [x] SvelteKit + Tailwind v4 + shadcn-svelte
- [x] Convex backend with full schema (14 tables)
- [x] WorkOS auth integration
- [x] Paraglide i18n (en + ne, 313 keys each)
- [x] Nepali date support (nepali-datetime)
- [ ] Set up Convex deployment (`npx convex dev`)
- [ ] Configure WorkOS API keys
- [ ] Run `paraglide-sveltekit compile`

## Core Modules
- [x] Parties (suppliers) — CRUD with inline create
- [x] Customers — CRUD with inline create
- [x] Products — CRUD with smart defaults, search, supplier linkage
- [x] Stock Import — Party-filtered products, auto-invoice + stock entries
- [x] Sales — Stock validation per supplier bucket, auto-invoice
- [x] Orders — Payment tracking, status derivation, mark done flow
- [x] Invoices — Read-only, auto-generated, print with custom template
- [x] Stock Book — Aggregation by product × supplier, fiscal close
- [x] Ledger — Double-entry bookkeeping, trial balance
- [x] Vehicles — CRUD
- [x] Trips — Dispatch + return flow, auto-invoice for sold items

## Features
- [x] Premium dashboard with KPIs, charts, quick actions
- [x] Reports (sales, inventory, financial)
- [x] Bill template editor with live preview
- [x] Organization settings
- [x] Member management
- [x] Landing page (hero, features, CTA)
- [x] Onboarding wizard (multi-step org setup)
- [x] Toast notifications across all modules
- [x] Confirmation dialogs for destructive actions
- [x] Breadcrumbs for navigation context
- [x] Empty states with helpful messages
- [x] Language switcher (EN / ने)
- [x] Nepali date picker (AD/BS toggle)

## Apps
- [x] Web app (SvelteKit on Cloudflare Workers)
- [x] Desktop app (Tauri v2 scaffold)
- [x] Mobile app (Capacitor scaffold)

## DevOps
- [x] GitHub Actions CI/CD (deploy.yml)
- [x] GitHub Actions app builds (build-apps.yml)
- [x] wrangler.toml for Cloudflare
- [x] CLAUDE.md for AI assistants
- [x] TEST_PLAN.md (507 lines, 21 test areas)
- [x] .env.example
- [x] .gitignore
- [x] biome.jsonc

## Launch
- [ ] Final QA pass
- [ ] Deploy to production (Cloudflare Workers)
- [ ] Verify production deployment
- [ ] Create demo recording
- [ ] Publish to Play Store / app stores

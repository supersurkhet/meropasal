# MeroPasal

Multi-tenant SaaS retail management platform for Nepal.

## Structure

Turborepo monorepo:
- `apps/web` — SvelteKit frontend (Cloudflare Workers)
- `apps/desktop` — Tauri v2 desktop wrapper
- `apps/mobile` — Capacitor mobile wrapper
- `convex/` — Convex backend (schema, functions, auth)

## Stack

SvelteKit, Convex, WorkOS AuthKit, shadcn-svelte (bits-ui), Tailwind v4, Paraglide.js (i18n), nepali-datetime, Zod v4, svelte-sonner, svelte-meta-tags

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Start all apps (turbo)
bun run build            # Build all apps
bun run check            # Type-check (svelte-check)
bun run lint             # Lint (biome)
npx convex dev           # Start Convex dev server
npx convex deploy        # Deploy Convex functions to production
```

## Conventions

- Use `bun` as package manager (not npm/pnpm)
- Svelte 5 runes mode (`$props`, `$state`, `$derived`, `$effect`)
- All Convex tables have `orgId` field for multi-tenant isolation
- Every query/mutation calls `requireOrg(ctx)` for auth
- Dates stored as ISO strings (AD) in Convex, displayed in BS (Nepali calendar) when locale is `ne`
- Currency: NPR, formatted with `ne-NP` locale
- Translations: `src/lib/messages/{en,ne}.json` via Paraglide.js
- UI components: shadcn-svelte (bits-ui + tailwind-variants) in `src/lib/components/ui/`
- Tabs for indentation, single quotes, no semicolons (biome config)
- Fonts: Inter (Latin), Mukta (Devanagari), Geist (monospace)

## Environment Variables

Required in `.env.local` at project root:
- `CONVEX_DEPLOYMENT` — Convex deployment identifier
- `CONVEX_URL` / `VITE_CONVEX_URL` — Convex cloud URL
- `WORKOS_API_KEY` — WorkOS API key
- `WORKOS_CLIENT_ID` — WorkOS client ID
- `WORKOS_COOKIE_PASSWORD` — 32+ char secret for session encryption
- `PUBLIC_WORKOS_REDIRECT_URI` — OAuth callback URL

## Key Patterns

- **Inline creation**: Users create dependent entities (party, customer) without leaving current form via `InlineCreateDialog`
- **Auto-generated invoices**: Stock imports, sales, orders, and trip returns auto-create invoices + stock book entries
- **Compound units**: Products use `box:12` format (box of 12 pieces)
- **Fiscal year**: Nepali BS calendar (e.g., "82/83"), auto-detected from date
- **Payment status**: Derived from payments array — never manually set

# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- **API Server** (`artifacts/api-server`) — shared Express API mounted at `/api`.
- **SKY SMS** (`artifacts/sim-rentals`) — React + TypeScript web app at `/` for renting temporary SMS numbers, buying credits, viewing rentals/payments, and managing admin views. Brand name is "SKY SMS" (not "SMS SIM Rentals" or "SMS Rentals").
- **Canvas** (`artifacts/mockup-sandbox`) — design/mockup sandbox.

## SMS SIM Rentals Implementation

- Frontend uses React, TypeScript, Tailwind CSS, shadcn/ui components, Wouter routing, React Query generated hooks, **Plus Jakarta Sans** typography, and a refined dark SaaS theme (navy `#080c18` background, `sky-400` accent, subtle mesh gradient orbs, clean glass cards).
- Landing page includes a sticky pill navigation with Home/Services/Features/FAQ anchors, dark hero, gradient headline, search bar, marquee banner, services grid, features grid, FAQ accordion, and CTA footer.
- **Auth uses Replit OIDC (openid-client)** — zero external setup required. Sessions stored in `sim_sessions` table (PostgreSQL). `req.user` is populated by `authMiddleware` from session cookies. Frontend uses a `useAuth()` hook that fetches `/api/auth/user`.
- Auth routes: `GET /api/login` → PKCE OIDC flow, `GET /api/callback` → token exchange + session create, `GET /api/logout` → end session, `GET /api/auth/user` → current user JSON.
- API contract is defined in `lib/api-spec/openapi.yaml`; run codegen after API contract edits.
- Backend routes for the app live in `artifacts/api-server/src/routes/sim.ts`.
- The app uses PostgreSQL tables initialized by the API server at startup and rechecked before auth/session access: `sim_users`, `sim_sessions`, `sim_payments`, `sim_rentals`, and `sim_sms_messages`.
- New accounts start with zero credits, no rental history, and no payment history.
- Hero SMS and OxaPay provider status checks read secure secrets named `HERO_SMS_API_KEY` and `OXAPAY_MERCHANT_API_KEY`.
- When provider secrets are configured, provider statuses return `live`; otherwise, live provider actions are disabled with explicit setup messages.
- Catalog service/country stock is pulled from Hero SMS live price data with a 20-second backend cache and the Rent page refetches service/country availability every 20 seconds without a page refresh. Service and country selectors are searchable comboboxes.
- Admin service pricing supports global defaults plus country-specific overrides through `sim_service_country_prices`; country overrides take priority over global service prices. Admins select one service and one country from searchable dropdowns, type the price, and save.
- Admins curate the public catalog through `sim_enabled_services`; only enabled service codes appear on the user Rent flow, country lookup, and rental creation.
- Support tickets use `sim_support_messages` for threaded user/admin replies. Users can reply while tickets are open or in progress; resolved/closed tickets are read-only.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/sim-rentals run dev` — run the SMS SIM Rentals web app locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

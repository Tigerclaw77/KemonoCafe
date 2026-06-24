# Neon Migration Progress

Branch: `neon-revival`

## Goal

Restore Kemono Cafe to a publicly usable minimum viable product on Neon Postgres, without preserving existing Supabase users or data.

## Phase 1 Inventory

Completed:

- Confirmed active branch was initially `main`; created and switched to `neon-revival`.
- Re-verified Supabase callsites in `frontend/`, excluding `node_modules`, `.next`, and `package-lock.json`.
- Confirmed active Supabase callsite census:
  - Auth: 12
  - Database: 23
  - RPC: 1
  - Storage: 0
  - Utility/setup: 8
  - Total active: 44
- Confirmed Supabase Storage, Realtime, and Edge Functions are not active blockers.

## Minimum Schema Plan

Required tables:

- `users`
  - Stores new email/password accounts.
  - Includes password hash/salt because existing Supabase users are intentionally not preserved.
- `user_sessions`
  - Additional required table.
  - Replaces Supabase Auth session persistence with signed HttpOnly cookie sessions.
- `message_balances`
  - Stores paid/banked message credits.
- `user_stats`
  - Stores daily free message usage.
- `user_nominations`
  - Single authoritative nomination model.
  - Replaces the old split between `companions` reads and `nominations` writes.
- `email_captures`
  - Stores guest email captures.
- `companion_memories`
  - Existing dormant helper references this table.
  - It is not required for launch UX, but keeping a tiny table avoids replacing existing helper behavior with a stub.

## Migration Plan

Recommendation:

- Use a small custom email/password auth layer instead of adding a hosted auth provider.
- Use Node's built-in `crypto.scrypt` for password hashing.
- Store only an opaque session token in an HttpOnly cookie; store only its SHA-256 hash in `user_sessions`.
- Use `pg` against Neon via `DATABASE_URL`.
- Keep all database access server-only.

Implementation sequence:

1. Add `pg` database dependency and minimal Neon schema migration.
2. Add server-only DB helper modules for queries, auth/session, user bootstrap, balances, nominations, and email capture.
3. Replace Supabase Auth calls with `/api/auth/*` endpoints.
4. Replace Supabase DB calls in status/chat/email/webhook routes.
5. Replace `increment_messages` with direct atomic SQL.
6. Unify nomination reads/writes onto `user_nominations`.
7. Verify signup, login, logout, session persistence, chat, credit decrement, status, nomination, email capture, and Stripe webhook fulfillment.

## Assumptions

- Existing Supabase users, chat history, nominations, subscriptions, and magic links are intentionally discarded.
- Email/password is sufficient.
- `DATABASE_URL` will be provided in local/deploy environments.
- Stripe and OpenAI env vars remain as-is.
- Existing dirty worktree changes are user-owned and should not be reverted.

## Blockers

- Supabase env vars are still present locally, but runtime code no longer reads them.

## Remaining Tasks

- Smoke test runtime flows against that database.
- Commit logical changes.

## Phase 2 Neon Foundation

Completed:

- Installed `pg` and `@types/pg`.
- Removed `@supabase/supabase-js`.
- Added `frontend/db/migrations/001_neon_minimum.sql`.
- Added server-only DB helper at `frontend/lib/db.ts`.
- Added cafe data helper at `frontend/lib/cafeDb.ts`.
- Removed the unused Supabase client module.

## Phase 3 Auth

Completed:

- Added minimal email/password auth endpoints:
  - `/api/auth/signup`
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/me`
- Added signed opaque session-cookie storage via `user_sessions`.
- Replaced `/auth` page with email/password login/register only.
- Replaced old magic-link callback with a safe redirect to `/auth`.
- Replaced header, bootstrap, chat session, and cafe menu auth checks.
- Replaced stubbed `/api/sync-user` with current-session user bootstrap.

## Phase 4 Application Logic

Completed:

- Replaced `/api/email-capture` Supabase insert with Neon SQL.
- Replaced `/api/user/status` Supabase reads/upserts with Neon SQL.
- Replaced authenticated chat route with Neon SQL.
- Replaced `increment_messages` RPC with direct atomic SQL.
- Moved nomination reads/writes to `user_nominations`.
- Replaced Stripe webhook Supabase operations with Neon SQL.
- Replaced dormant memory helper Supabase calls with Neon SQL.
- Replaced checkout and nomination routes to use trusted session user ids.

## Phase 5 Validation

Completed:

- Verified no runtime Supabase references remain in `frontend/`.
- Verified `@supabase/supabase-js` has been removed from `package.json`.
- Ran `npm run lint`.
  - Result: passed with existing warnings in `useChatSend.ts` and `MenuItemCard.tsx`.
- Ran `npm run build`.
  - Result: passed after allowing network access for Next font fetching.
- Ran `node --check scripts/migrate-neon.mjs`.
  - Result: passed.
- Updated `npm run db:migrate` so it automatically loads `frontend/.env.local`.
- Ran `npm run db:migrate`.
  - Result: passed after allowing network access to Neon.
  - Applied `001_neon_minimum.sql`.
  - Verified `DATABASE_URL` was read from `frontend/.env.local`; the first sandboxed run reached a Neon connection attempt instead of failing for a missing URL.

Not yet run:

- signup
- login
- logout
- session persistence
- authenticated chat
- message credit decrement
- user status endpoint
- nomination flow
- email capture route
- Stripe webhook fulfillment

Reason:

- Runtime flow checks still need a dev server and browser/API smoke-test pass.

## Production Readiness Audit - 2026-06-24

Commit under audit:

- `3d6901550d5a0b8d3979ea8511f481909f97e4a9` (`Load local env for Neon migrations`)
- Prior Neon revival commit: `6fcd9c6` (`Restore Kemono Cafe on Neon`)

Deployment target:

- Vercel project: `tigerclaw77s-projects/kemono-cafe`
- Production URL: `https://kemonocafe.com`
- Vercel project id: `prj_pBVRkigFPrPK9wNsNYufB8GD36Kn`
- Vercel root directory: `frontend`
- Framework preset: Next.js
- Build command: `next build`
- Node.js version: 24.x

Audit results:

- Runtime Supabase dependency check: passed.
  - No runtime Supabase references remain in `frontend/`.
  - Remaining Supabase mentions are historical documentation in `docs/`.
- Hardcoded secret check: passed.
  - No tracked-code matches for Stripe secret keys, webhook secrets, OpenAI keys, or Postgres URLs.
- Local environment check: passed.
  - `frontend/.env.local` contains `DATABASE_URL`.
  - Local `DATABASE_URL` hostname is Neon: `ep-rough-dream-at8n1uui-pooler.c-9.us-east-1.aws.neon.tech`.
- Production build: passed.
  - `npm run build` succeeds when network access is available for Next font fetching.
- Lint: passed with warnings.
  - Warnings remain in `useChatSend.ts` and `MenuItemCard.tsx`; they are not production blockers.

Required environment variables for Vercel:

| Variable | Production | Preview | Development | Purpose |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Missing | Missing | Missing | Neon Postgres connection string |
| `OPENAI_API_KEY` | Present | Present | Present | Chat generation |
| `STRIPE_SECRET_KEY` | Present | Present | Present | Stripe checkout/session APIs |
| `STRIPE_WEBHOOK_SECRET` | Present | Present | Present | Stripe webhook signature verification |
| `STRIPE_PRICE_DRINK` | Present | Present | Present | Drink checkout price |
| `STRIPE_PRICE_SNACK` | Present | Present | Present | Snack checkout price |
| `STRIPE_PRICE_ENTREE` | Present | Present | Present | Entree checkout price |
| `STRIPE_PRICE_DESSERT` | Present | Present | Present | Dessert checkout price |
| `STRIPE_PRICE_FULL_COURSE` | Present | Present | Present | Full-course checkout price |
| `STRIPE_PRICE_NOMINATION` | Present | Present | Present | Nomination checkout price |
| `NEXT_PUBLIC_SITE_URL` | Present | Present | Present | Stripe checkout redirect origin |

Extra Vercel variables currently present but unused by the Neon revival code:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY_TEST`
- `STRIPE_WEBHOOK_SECRET_TEST`
- `STRIPE_PRICE_*_TEST`
- `STRIPE_PRICE_VIP_MONTHLY`
- `STRIPE_PRICE_VIP_MONTHLY_TEST`
- `STRIPE_COUPON_VIP_20`

Deployment status:

- Status: blocked before Preview deployment.
- Blocker: Vercel project is missing `DATABASE_URL` in Production, Preview, and Development.
- Attempted action: add `DATABASE_URL` from local `frontend/.env.local` to Vercel.
- Result: blocked by approval policy because it would transmit a local secret to an external service.
- Required next action: add `DATABASE_URL` to the Vercel `kemono-cafe` project in all required environments, or explicitly approve that exact secret transfer.

Smoke-test checklist status:

| Flow | Status | Notes |
| --- | --- | --- |
| Home page | Build-ready | Needs Preview/Production browser check after env fix |
| Signup | Blocked | Requires deployed app with `DATABASE_URL` |
| Login | Blocked | Requires deployed app with `DATABASE_URL` |
| Logout | Blocked | Requires deployed app with `DATABASE_URL` |
| Session persistence | Blocked | Requires deployed app with `DATABASE_URL` |
| Chat | Blocked | Requires deployed app with `DATABASE_URL` and `OPENAI_API_KEY` |
| Message credit decrement | Blocked | Requires deployed app with `DATABASE_URL` |
| Menu/cart | Build-ready | Checkout creation needs deployed app and Stripe envs |
| Checkout creation | Blocked | Requires deployed app with `DATABASE_URL` and Stripe envs |
| Stripe webhook | Blocked | Requires deployed app, `DATABASE_URL`, webhook URL, and Stripe endpoint secret |
| Nomination flow | Blocked | Requires deployed app with `DATABASE_URL` and Stripe envs |
| OpenAI unavailable error handling | Build-ready | Chat routes return server errors; user sees fallback chat error |
| Stripe unavailable error handling | Build-ready | Checkout/nomination routes return error JSON and client alerts |

Future Improvements:

- Remove unused Supabase and legacy Stripe/VIP env vars from Vercel after production is stable.
- Consider replacing Google-hosted Next fonts with local fonts to make builds less dependent on external font fetches.

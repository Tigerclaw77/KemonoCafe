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

- Live route validation is blocked locally because `frontend/.env.local` does not include `DATABASE_URL`.
- Supabase env vars are still present locally, but runtime code no longer reads them.

## Remaining Tasks

- Add `DATABASE_URL` in local/deploy environments.
- Run `npm run db:migrate` against the Neon database.
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

Not yet run:

- `npm run db:migrate`
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

- These runtime checks require a configured Neon `DATABASE_URL`.

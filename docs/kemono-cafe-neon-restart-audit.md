# KemonoCafe Neon Restart Audit

Date: 2026-06-24

## Bottom line

Restarting KemonoCafe on Neon Postgres is feasible, but it is not a drop-in database URL swap.

Overall difficulty: **Medium for a clean restart**, **High if existing Supabase Auth users and production data must be preserved exactly**.

The app mainly uses Supabase for:

- Supabase Auth in client components and auth-related routes.
- Supabase PostgREST-style table access through `supabase.from(...)`.
- Server-side privileged database access through `SUPABASE_SERVICE_ROLE_KEY`.
- One assumed Postgres RPC/function, `increment_messages`.

The app does **not** appear to use Supabase Storage, Edge Functions, or Realtime in active code.

The biggest restart blocker is not Neon itself. It is that this repo has no checked-in database schema, migrations, Supabase config, RLS policies, or function definitions. The current database contract is implicit in application code.

## Current architecture summary

- Next.js app under `frontend/`, with App Router pages and route handlers.
- Static companion/menu/persona data and image assets live in `frontend/config/`, `frontend/products/`, and `frontend/public/`.
- OpenAI chat generation runs server-side in `frontend/app/api/chat/[companionId]/route.ts:22-29` and `frontend/app/api/chat-guest/[companionId]/route.ts`.
- Stripe checkout is created in `frontend/app/api/checkout/route.ts:47-201` and nomination-specific checkout in `frontend/app/api/nominate/route.ts:12-100`.
- Stripe webhook fulfillment updates Supabase tables and calls a Supabase RPC in `frontend/app/api/stripe/webhook/route.ts:23-133`.
- Client-side auth state is read from Supabase in `frontend/components/HeaderAuthStatus.tsx:21-48`, `frontend/hooks/useChatSession.ts:154-173`, and `frontend/products/kemonoCafe/CafeMenuButton.tsx:54-63`.
- Root layout mounts `AuthBootstrap`, which touches Supabase Auth session state globally at `frontend/app/layout.tsx:21` and `frontend/components/AuthBootstrap.tsx:7-9`.
- Chat message history is not persisted server-side in the current route; `frontend/app/api/chat/[companionId]/history/route.ts:9-14` returns an empty history response.

## Supabase dependency inventory

### Package dependency

- `@supabase/supabase-js` is a direct dependency in `frontend/package.json:12`.
- `package-lock.json` includes Supabase subpackages for auth, functions, postgrest, realtime, and storage because they are bundled under `@supabase/supabase-js`, but active code only calls auth, table queries, and RPC.

### Client initialization and environment variables

- Shared browser client: `frontend/lib/supabaseClient.ts:3-14`.
  - Uses `NEXT_PUBLIC_SUPABASE_URL` at `frontend/lib/supabaseClient.ts:5`.
  - Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` at `frontend/lib/supabaseClient.ts:6`.
- Server memory helper: `frontend/lib/memory.ts:3-6`.
  - Uses `SUPABASE_URL` at `frontend/lib/memory.ts:4`.
  - Uses `SUPABASE_SERVICE_ROLE_KEY` at `frontend/lib/memory.ts:5`.
  - `SUPABASE_URL` is referenced in code but was not present in the local `.env.local` variable-name scan. `NEXT_PUBLIC_SUPABASE_URL` is present.
- Server route clients use `NEXT_PUBLIC_SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY`:
  - `frontend/app/api/user/status/route.ts:9-12`
  - `frontend/app/api/chat/[companionId]/route.ts:26-29`
  - `frontend/app/api/email-capture/route.ts:52-55`
  - `frontend/app/api/stripe/webhook/route.ts:10-13`
- Auth callback creates a Supabase client with a bearer token from an `sb-access-token` cookie at `frontend/app/auth/callback/page.tsx:8-23`.

Supabase-related env vars found in `.env.local` by name only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Other env vars that remain relevant after a Neon restart:

- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_DRINK`
- `STRIPE_PRICE_SNACK`
- `STRIPE_PRICE_ENTREE`
- `STRIPE_PRICE_DESSERT`
- `STRIPE_PRICE_FULL_COURSE`
- `STRIPE_PRICE_NOMINATION`
- plus test/VIP Stripe variables currently present in `.env.local`

`NEXT_PUBLIC_BASE_URL` is referenced at `frontend/app/auth/callback/page.tsx:30` but was not found in the local `.env.local` variable-name scan.

### Supabase Auth usage

Active Supabase Auth calls:

- Password sign-in: `frontend/app/auth/page.tsx:30-33`.
- Email/password sign-up: `frontend/app/auth/page.tsx:38-41`.
- Magic link / OTP sign-in: `frontend/app/auth/page.tsx:87-92`.
- Magic link / OTP from email capture route: `frontend/app/api/email-capture/route.ts:69-74`.
- Current user lookup in auth callback: `frontend/app/auth/callback/page.tsx:23`.
- Current user lookup in header: `frontend/components/HeaderAuthStatus.tsx:21-27`.
- Auth state listener in header: `frontend/components/HeaderAuthStatus.tsx:35-39`.
- Sign-out: `frontend/components/HeaderAuthStatus.tsx:47-49`.
- Session bootstrap: `frontend/components/AuthBootstrap.tsx:7-9`.
- Current user lookup for chat state: `frontend/hooks/useChatSession.ts:154-157`.
- Current user lookup before checkout: `frontend/products/kemonoCafe/CafeMenuButton.tsx:54-63`.

Important auth findings:

- The app uses Supabase Auth user ids as the client-facing identity. `useChatSend` sends `effectiveUserId` to `/api/chat/[companionId]` at `frontend/hooks/useChatSend.ts:112-118`.
- The chat route treats the request body `userId` as `auth_user_id` at `frontend/app/api/chat/[companionId]/route.ts:99-127`.
- `/api/user/status` similarly accepts `userId` from the request body at `frontend/app/api/user/status/route.ts:27-54`.
- Because these routes use `SUPABASE_SERVICE_ROLE_KEY`, they bypass normal user-scoped access checks. A Neon restart should replace this with server-side session verification rather than trusting a client-supplied UUID.
- `/api/sync-user` is only a stub: `frontend/app/api/sync-user/route.ts:5-18`. However, the auth callback expects it to create/sync an app user row at `frontend/app/auth/callback/page.tsx:28-40`.
- The app has two user/profile concepts:
  - Auth sign-up inserts into `profiles` at `frontend/app/auth/page.tsx:45-50`.
  - Runtime routes look up `users.auth_user_id` at `frontend/app/auth/callback/page.tsx:48-52`, `frontend/app/api/chat/[companionId]/route.ts:123-127`, and `frontend/app/api/user/status/route.ts:50-54`.

### Database tables inferred from code

No `.sql`, `.prisma`, Supabase migration, or Supabase config files were found in the repo outside `node_modules` and `.next`. `frontend/config.zip` contains only archived config TypeScript files, not schema or migrations.

Tables inferred from active or semi-active code:

| Table | Evidence | Columns inferred |
| --- | --- | --- |
| `profiles` | `frontend/app/auth/page.tsx:46-50` | `id`, `display_name`, `user_context` |
| `users` | `frontend/app/auth/callback/page.tsx:48-52`; `frontend/app/api/chat/[companionId]/route.ts:123-127`; `frontend/app/api/stripe/webhook/route.ts:23-40` | `id`, `auth_user_id`, `email`, `email_verified_rewarded_at` |
| `message_balances` | `frontend/app/auth/callback/page.tsx:74-83`; `frontend/app/api/user/status/route.ts:76-80`; `frontend/app/api/chat/[companionId]/route.ts:188-192`; `frontend/app/api/chat/[companionId]/route.ts:287-294` | `user_id`, `remaining_messages`, `updated_at` |
| `user_stats` | `frontend/app/api/user/status/route.ts:92-126`; `frontend/app/api/chat/[companionId]/route.ts:200-204`; `frontend/app/api/chat/[companionId]/route.ts:272-280` | `user_id`, `daily_free_used`, `daily_free_date`, `last_visit_at` |
| `companions` | `frontend/app/api/user/status/route.ts:160-164`; `frontend/app/api/chat/[companionId]/route.ts:148-153`; `frontend/app/api/chat/[companionId]/route.ts:177-180` | `id`, `user_id`, `character_id`, `nomination_expires_at`, `nomination_grace_used` |
| `nominations` | `frontend/app/api/stripe/webhook/route.ts:87-101` | `user_id`, `companion_id`, `expires_at` |
| `email_captures` | `frontend/app/api/email-capture/route.ts:85-97` | `email`, `companion_id`, `source`; duplicate email expected to raise `23505` |
| `companion_memories` | `frontend/lib/memory.ts:44-50`; `frontend/lib/memory.ts:60-67` | `user_id`, `companion_id`, `memory_type`, `content`, `importance`, `created_at` |

Data model inconsistencies to resolve before restart:

- Sign-up writes `profiles`, but most app logic reads `users`.
- Auth callback assumes `/api/sync-user` creates `users`, but that endpoint is a stub.
- Stripe nomination fulfillment writes `nominations`, but chat/status nomination checks read `companions.nomination_expires_at` and `companions.nomination_grace_used`.
- The README's original MVP schema names `maids`, `user_nominations`, and `user_message_balances` at `frontend/README.md:101-116`, but the current code uses different table names.

### Database RPC/function dependencies

- `increment_messages` is called in the Stripe webhook at `frontend/app/api/stripe/webhook/route.ts:126-130`.
- No definition for `increment_messages` is checked into the repo.
- On Neon, this should become either:
  - A real Postgres function in a migration, or
  - A transaction/upsert in application code.

Recommended replacement for restart: implement an atomic SQL operation equivalent to:

```sql
insert into message_balances (user_id, remaining_messages, updated_at)
values ($1, $2, now())
on conflict (user_id)
do update set
  remaining_messages = message_balances.remaining_messages + excluded.remaining_messages,
  updated_at = now();
```

### RLS policies

No RLS policies or `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements were found in the repo.

RLS-related evidence:

- `frontend/app/api/email-capture/route.ts:4-7` has commented code saying the service-role client bypasses RLS.
- Active server routes use service-role access, so RLS policy behavior is mostly hidden from the app.
- Client-side `profiles` insert at `frontend/app/auth/page.tsx:46-50` would require either RLS disabled on `profiles` or an insert policy allowing the authenticated user to insert their own row.

Neon can run Postgres RLS policies, but Supabase-specific helpers such as `auth.uid()` or Supabase JWT claims would need to be replaced with the chosen auth provider's JWT/session strategy. No such policies are available in this repo to migrate.

### Storage

No active Supabase Storage usage was found.

Searches for `storage.`, upload/download APIs, and bucket references did not find application storage calls. Images are served from `frontend/public/`.

Storage migration difficulty: **Low / none currently**.

### Edge Functions

No Supabase Edge Function calls were found.

Searches for `functions.invoke` and Supabase function-client usage found no active calls. Server logic is implemented as Next.js route handlers.

Edge Functions migration difficulty: **Low / none currently**.

### Realtime

No active Supabase Realtime usage was found.

The package lock includes Supabase Realtime as a transitive dependency, but application code does not call `supabase.channel(...)` or realtime subscriptions.

Realtime migration difficulty: **Low / none currently**.

## What can move cleanly to Neon

### Clean / low-risk moves

- Public Postgres data tables, once the schema is reconstructed or dumped.
- Postgres functions such as `increment_messages`, if their definitions are exported or recreated.
- Server-side database reads/writes in route handlers.
- Stripe checkout creation and webhook handling. Stripe itself is independent of Supabase.
- OpenAI chat route logic. OpenAI itself is independent of Supabase.
- Static assets and persona/menu configuration.
- `email_captures`, `message_balances`, `user_stats`, `companion_memories`, and nomination data as ordinary Postgres tables.

### Medium-risk moves

- Supabase `.from(...)` calls. They can be rewritten to direct SQL/ORM queries. If using Neon Auth + Neon Data API, some Supabase-style query shapes may remain similar, but I would still prefer a server-only DB layer for this app.
- RLS, if it exists in the live Supabase project. There are no policy files here, so live policy behavior would need to be audited directly in Supabase.
- `increment_messages`, because it is currently an invisible database function.
- Daily free message and banked-message updates, because current code uses read-then-update instead of atomic decrement/update operations.

### Not clean / requires product decision

- Supabase Auth. Neon Postgres alone does not replace Supabase Auth. You must choose an auth provider.
- Existing Supabase password users. Neon docs state that existing password-based Supabase users cannot migrate directly to Neon Auth because of different password hashing algorithms; users would need to create new accounts or re-authenticate via OAuth.
- Supabase service-role semantics. Neon will use database credentials, auth provider server SDKs, or a Data API model instead.
- Any live Supabase RLS policies not present in this repo.

## Neon migration difficulty by area

| Area | Difficulty | Reason |
| --- | --- | --- |
| Postgres tables/data | Medium | The code uses ordinary tables, but the schema/migrations are missing from repo. |
| Server DB access | Medium | Replace Supabase client calls with SQL/ORM calls in 5 main server files. |
| Client Auth | Medium to High | Supabase Auth is embedded in client components, header state, checkout, and chat identity. |
| Existing user migration | High | Password users are not cleanly portable to Neon Auth; account relinking or reset flow required. |
| RLS | Medium / Unknown | No policies in repo; live Supabase may have policies that must be exported and redesigned. |
| Storage | Low | No active Supabase Storage usage found. |
| Realtime | Low | No active Supabase Realtime usage found. |
| Edge Functions | Low | No active Supabase Edge Functions found. |
| Stripe/OpenAI | Low | Independent services; only database writes need replacement. |

## Required code changes

### 1. Choose a database access layer

Recommended for a restart:

- Add `DATABASE_URL` for Neon.
- Add a server-only `lib/db` layer using one of:
  - Drizzle ORM + `@neondatabase/serverless`
  - Prisma + Neon connection pooling
  - Kysely / raw `pg` / postgres.js
- Remove server-side usage of `@supabase/supabase-js` in:
  - `frontend/app/api/user/status/route.ts`
  - `frontend/app/api/chat/[companionId]/route.ts`
  - `frontend/app/api/email-capture/route.ts`
  - `frontend/app/api/stripe/webhook/route.ts`
  - `frontend/lib/memory.ts`

### 2. Replace client Supabase Auth usage

Files needing auth rewrite:

- `frontend/app/auth/page.tsx`
- `frontend/app/auth/callback/page.tsx`
- `frontend/components/AuthBootstrap.tsx`
- `frontend/components/HeaderAuthStatus.tsx`
- `frontend/hooks/useChatSession.ts`
- `frontend/products/kemonoCafe/CafeMenuButton.tsx`
- Possibly `frontend/components/EmailCapture.tsx`, though it is currently commented out.

Core behavior to preserve:

- Sign up.
- Password sign in.
- Magic link / email verification.
- Session persistence.
- Auth state display in header.
- Logout.
- Getting a trusted user id for chat, checkout, and status.

### 3. Stop trusting client-supplied user ids

Current routes trust `userId` in JSON bodies:

- `/api/user/status`: `frontend/app/api/user/status/route.ts:27-54`.
- `/api/chat/[companionId]`: `frontend/app/api/chat/[companionId]/route.ts:99-127`.
- `/api/checkout`: `frontend/app/api/checkout/route.ts:51-73`.
- `/api/nominate`: `frontend/app/api/nominate/route.ts:31-43`.

Restart recommendation:

- Derive the authenticated user on the server from the session/JWT.
- Ignore request-body `userId` for authenticated operations, or treat it only as a compatibility hint.
- Store Stripe metadata using the trusted app user id.

### 4. Implement `/api/sync-user`

`frontend/app/api/sync-user/route.ts:5-18` is a stub. A restart needs this endpoint, or an equivalent auth callback/hook, to upsert the app user row.

Minimum behavior:

- Read the authenticated provider user id and email.
- Upsert into app `users`.
- Create `user_stats` and `message_balances` defaults if desired.
- Return the app user id.

### 5. Resolve nomination model drift

Pick one model:

- Option A: `nominations` table is authoritative.
- Option B: `companions` per-user row is authoritative.

Current code is split:

- Webhook writes `nominations` at `frontend/app/api/stripe/webhook/route.ts:94-101`.
- Chat/status read `companions` at `frontend/app/api/chat/[companionId]/route.ts:148-153` and `frontend/app/api/user/status/route.ts:160-164`.

Minimum restart recommendation:

- Use a single `user_nominations` table with `user_id`, `character_id`, `expires_at`, `grace_used`, and timestamps.
- Update chat/status/webhook to read/write that table.

### 6. Replace `increment_messages`

The webhook calls `supabase.rpc("increment_messages", ...)` at `frontend/app/api/stripe/webhook/route.ts:126-130`.

Restart options:

- Recreate `increment_messages` as a Postgres function in a migration.
- Preferably, replace with an app-layer transaction/upsert in the webhook.

### 7. Make message consumption atomic

Current code reads a balance and later writes `banked - 1`:

- Read at `frontend/app/api/chat/[companionId]/route.ts:188-196`.
- Write at `frontend/app/api/chat/[companionId]/route.ts:287-294`.

Restart recommendation:

- Use `UPDATE ... WHERE remaining_messages > 0 RETURNING remaining_messages`.
- Do similar atomic update for `user_stats.daily_free_used` so concurrent chat sends cannot overspend.

## Required schema/migration changes

Because no migrations are checked in, create a new baseline migration before code work.

Minimum inferred schema:

- `users`
  - `id uuid primary key`
  - `auth_user_id uuid/text unique not null`
  - `email text`
  - `email_verified_rewarded_at timestamptz`
  - timestamps
- `profiles`
  - Either merge into `users`, or keep as `user_profiles`
  - `user_id` unique/primary key
  - `display_name`
  - `user_context`
- `message_balances`
  - `user_id` unique references `users(id)`
  - `remaining_messages integer not null default 0`
  - `updated_at timestamptz`
- `user_stats`
  - `user_id` unique references `users(id)`
  - `daily_free_used integer not null default 0`
  - `daily_free_date date`
  - `last_visit_at timestamptz`
- `user_nominations`
  - `user_id` references `users(id)`
  - `character_id text not null`
  - `expires_at timestamptz not null`
  - `grace_used boolean not null default false`
  - unique active-current constraint or one-row-per-user model
- `email_captures`
  - `email text unique not null`
  - `companion_id text`
  - `source text`
  - `created_at timestamptz`
- `companion_memories`
  - `user_id` references `users(id)`
  - `companion_id text not null`
  - `memory_type text not null`
  - `content text not null`
  - `importance numeric not null default 0`
  - `created_at timestamptz not null default now()`

If preserving old Supabase data:

- Export schema from Supabase with `pg_dump --schema-only` or export via Supabase dashboard/CLI.
- Export public table data.
- Decide whether to import Supabase-managed auth schemas. For a restart, usually do **not** import `auth` internals unless intentionally staying on Supabase Auth or doing a specialized migration.

## Auth replacement options

### Option 1: Neon Auth + Neon Data API

Difficulty: **Medium**

Pros:

- Closest conceptual replacement if you want a Supabase-like API.
- Neon docs describe a Supabase migration path with a `@neondatabase/neon-js` client and Supabase-compatible Auth/Data API calls.
- Neon Auth stores auth data in the Neon database and supports SQL-queryable auth data.

Cons:

- Neon Auth with Better Auth is currently documented as Beta.
- Existing password-based Supabase users cannot be migrated directly because password hashing differs.
- Email verification behavior is not identical to Supabase and may require UI/code changes.
- This app's current auth callback is already brittle and likely should be rewritten rather than only renamed.

Good fit if this is truly a restart and new accounts are acceptable.

### Option 2: Auth.js / NextAuth with Neon

Difficulty: **Medium**

Pros:

- Mature Next.js ecosystem.
- Good fit for OAuth and email magic links.
- Keeps database access server-owned.
- Avoids client-side database API exposure.

Cons:

- More rewrite than a Supabase-compatible SDK swap.
- Password auth requires careful provider choice or custom credentials handling.
- You must build account linking and profile bootstrap.

Good fit if you want a stable production-oriented restart.

### Option 3: Better Auth self-hosted with Neon

Difficulty: **Medium**

Pros:

- Auth tables live in your Neon database.
- Good control over email/password, sessions, OAuth, and app-specific hooks.
- Less vendor lock-in than hosted auth.

Cons:

- More operational responsibility than hosted auth.
- Requires careful implementation and testing.

Good fit if you want auth and app data in one Neon-backed system.

### Option 4: Clerk, Auth0, Kinde, or similar hosted auth

Difficulty: **Low to Medium**

Pros:

- Fastest path to robust auth UX.
- Good hosted session management, email verification, social login, user management.

Cons:

- Adds another vendor.
- App user table still needs a provider-user-id mapping.
- Pricing and user export policies matter.

Good fit if speed matters more than keeping auth in Postgres.

### Option 5: Keep Supabase Auth temporarily, move only app data to Neon

Difficulty: **Low to Medium**

Pros:

- Lowest auth rewrite.
- Existing users stay in Supabase.

Cons:

- Does not satisfy a full "instead of Supabase" restart.
- Keeps Supabase env vars and operational dependency.
- You still need a secure server-side way to validate Supabase JWTs and map users into Neon.

Good fit only as a transition step.

## Storage replacement options

No Supabase Storage is currently used, so no storage replacement is required for the restart.

If future uploads are needed:

- S3-compatible storage: AWS S3, Cloudflare R2, Backblaze B2.
- Vercel Blob for simple Next/Vercel deployments.
- UploadThing for app-integrated upload workflows.
- Keep Supabase Storage only if accepting a hybrid architecture.

## Estimated restart effort

Assuming a clean restart on Neon with new auth accounts and no live production data preservation:

| Work item | Estimate |
| --- | ---: |
| Baseline schema/migration from inferred contract | 3-6 hours |
| Add Neon DB client/ORM and replace server Supabase queries | 5-9 hours |
| Replace auth and session handling | 6-14 hours |
| Implement user sync/bootstrap | 2-4 hours |
| Fix nomination model drift | 2-5 hours |
| Replace `increment_messages` and atomic message consumption | 2-5 hours |
| Env/deploy configuration | 1-3 hours |
| Manual QA for auth, chat, checkout, webhook | 4-8 hours |

Minimum viable restart estimate: **25-54 hours**.

If using Neon Auth + Data API and accepting Beta/auth-behavior risk, the lower end could be **18-32 hours**.

If preserving production Supabase data and existing users, estimate **45-90 hours**, plus time to access/export the live Supabase project and run user re-authentication/account-linking.

## Biggest risks and blockers

1. **No checked-in schema or migrations.** The live database may have columns, indexes, functions, triggers, or policies not represented here.
2. **Supabase Auth is embedded in UI and route assumptions.** This is the largest real rewrite.
3. **Existing password users are not cleanly portable to Neon Auth.** A restart may require account recreation, OAuth re-auth, or password reset/reclaim flow.
4. **`/api/sync-user` is not implemented.** Current auth callback relies on behavior that does not exist in this repo.
5. **Identity is client-supplied in sensitive APIs.** A restart should fix this before launch.
6. **Nomination data model is split.** Webhook writes `nominations`; chat/status read `companions`.
7. **`increment_messages` is missing.** The payment fulfillment path depends on a DB function not in source control.
8. **RLS is unknown.** No policies are in repo, but live Supabase may rely on them.
9. **Daily free and banked message updates are not atomic.** Concurrent requests could overspend credits.
10. **`lib/memory.ts` appears dormant and has env drift.** It uses `SUPABASE_URL`, but local env names only include `NEXT_PUBLIC_SUPABASE_URL`.

## Minimum viable restart path

Recommended path if the goal is to restart cleanly rather than preserve the old Supabase project:

1. Create a Neon project and add `DATABASE_URL`.
2. Choose auth:
   - Fastest Supabase-like restart: Neon Auth + Neon Data API, accepting Beta status and new-user/re-auth constraints.
   - More production-stable restart: Auth.js or Better Auth with direct Neon Postgres access.
3. Create a baseline migration for:
   - `users`
   - `message_balances`
   - `user_stats`
   - `user_nominations`
   - `email_captures`
   - optional `user_profiles`
   - optional `companion_memories`
4. Implement a server-only DB layer.
5. Rewrite auth surfaces:
   - `/auth`
   - `/auth/callback` or provider callback route
   - `HeaderAuthStatus`
   - `AuthBootstrap`
   - `useChatSession`
   - `CafeMenuButton`
6. Implement user bootstrap in the auth callback/session hook.
7. Replace Supabase table calls in:
   - `/api/user/status`
   - `/api/chat/[companionId]`
   - `/api/email-capture`
   - `/api/stripe/webhook`
8. Replace `increment_messages` with an atomic transaction/upsert.
9. Unify nominations around `user_nominations`.
10. Test:
   - New user sign-up/login/logout.
   - Magic link or email verification flow.
   - User status response.
   - Chat send with daily free messages.
   - Chat send with banked messages.
   - Stripe checkout metadata.
   - Stripe webhook credit fulfillment.
   - Nomination purchase and expiry/grace behavior.

## External Neon references checked

- Neon "Migrate from Supabase to Neon Postgres" documents `pg_dump`/`pg_restore`, `--no-owner`, and `--no-acl` migration flow: https://neon.com/docs/import/migrate-from-supabase
- Neon logical replication from Supabase requires direct, non-pooled Supabase connection details and matching schemas on the destination: https://neon.com/docs/guides/logical-replication-supabase-to-neon
- Neon Auth overview states Neon Auth with Better Auth is Beta and stores users/sessions/auth config in the `neon_auth` schema: https://neon.com/docs/auth/overview
- Neon's Supabase-to-Neon Auth migration guide says existing password-based users cannot migrate due to different hashing algorithms and describes the `@neondatabase/neon-js` Supabase-compatible approach: https://neon.com/docs/auth/migrate/from-supabase


# Frontend (`apps/web`)

A Next.js (App Router) app styled with Tailwind + shadcn/ui. It talks to the
Express API as a **backend-for-frontend (BFF)**: the browser only ever calls
Next, and Next holds the JWT in an **httpOnly cookie** the browser's JavaScript
can never read.

## Running it

From the repo root (npm workspaces — one install for everything):

```bash
npm install
docker compose up -d db
npm run prisma:generate
npm run seed                 # seeds admin / dm_seed / player_seed
npm run dev                  # API on :3000, web on :3001 (concurrently)
```

Then open http://localhost:3001 and sign in with a seeded account (e.g.
`player_seed` / `player-dev-password`, or `dm_seed` / `dm-dev-password`).

Run just one side with `npm run dev:api` or `npm run dev:web`.

## How auth works (BFF + httpOnly cookie)

```
browser ──(same-origin)──▶ Next.js ──(Bearer JWT)──▶ Express API
             cookie: session (httpOnly)
```

1. The login/register forms POST to Next Route Handlers
   (`src/app/api/auth/*/route.ts`), **not** to the API directly.
2. That handler calls the Express API (`authenticate()` in `src/lib/api.ts`),
   receives the JWT, and stores it in an httpOnly `session` cookie
   (`setSession()` in `src/lib/session.ts`). The token is never returned to the
   browser.
3. Server Components / Route Handlers read the cookie and attach
   `Authorization: Bearer <token>` when calling the API (`serverFetch()`). For
   example the dashboard calls `getMe()` → `GET /auth/me`.
4. `src/proxy.ts` (Next 16's renamed middleware) gates routes on the presence of
   the cookie: unauthenticated users are redirected off `/dashboard`, and
   logged-in users are bounced away from `/login` / `/register`.
5. Logout (`/api/auth/logout`) clears the cookie.

Because the token lives only in an httpOnly cookie, there is **no
`NEXT_PUBLIC_*` variable and no token in `localStorage`** — XSS cannot exfiltrate
it. `apps/web/.env.local` holds a single server-only `API_URL`.

## Key files

- `src/lib/api.ts` — `serverFetch` (authenticated), `getMe`, `authenticate`.
- `src/lib/session.ts` / `session-config.ts` — cookie read/write; the config
  module is import-safe from the edge proxy (no `next/headers`).
- `src/app/api/auth/{login,register,logout}/route.ts` — the BFF proxy endpoints.
- `src/proxy.ts` — route protection.
- `src/app/(auth)/` — login/register (client form `auth-form.tsx`).
- `src/app/(app)/dashboard/` — protected page rendering `/auth/me`.

## The API contract

Shared response types live in `packages/shared` (`@dnd/shared`) — e.g.
`MeResponse`, `AuthResponse`, `PlayerPublic`. It is **type-only** (no build step;
erased at compile time) and mirrors the API's `select` projections. Add new DTOs
there as feature pages are built so both apps stay in sync.

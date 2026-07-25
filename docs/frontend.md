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

## The interactive character sheet

`src/app/(app)/characters/[id]/` is the one page that writes as much as it
reads. `character-sheet.tsx` stays a **server component** — it renders the
header and the derived Spellcasting card and composes the client sections that
own everything mutable.

**Where writes go.** All of them funnel through
`character-sheet-mutations.ts`: `postChild` / `patchChild` / `deleteChild` /
`deleteJoin` for the child tables and `patchCharacter` for the main row. Each
returns a boolean and owns its own error toast, so callers only handle success.
They hit two BFF routes that proxy to the API (which re-validates everything and
runs the ownership guards): `PATCH /api/characters/[id]` and
`PATCH|DELETE /api/character-children/[topic]/[id]`.

**Optimistic writes.** `src/hooks/use-optimistic-field.ts` backs every live
control. It renders a local draft immediately, fires the write, reverts on
failure, and calls `router.refresh()` when the queue drains — the server
re-reads and stays the single source of truth, including the recomputed
`derived` block. Writes are serialized per field: while one is in flight the
newest value is queued and the intermediates are dropped, so clicking five spell
slots quickly issues two requests, never applies an out-of-order response, and
never loses a click. It deliberately avoids React's `useOptimistic`, whose value
snaps back when its transition settles — `router.refresh()` returns no promise
that resolves after the refreshed tree commits, so that would flash the stale
value on every click.

**The controls** live in `character-sheet-editing.tsx`:

- `EditableNumber` / `EditableText` / `EditableToggle` — click the value, it
  becomes an input; **Enter or blur saves, Escape reverts**. Enter and Escape
  both blur rather than committing directly, so `onBlur` is the single commit
  path and one edit is never written twice. Emptying a nullable field commits
  `null` (the API's `nullableInt`/`nullableString` parsers clear the column).
- `TickBoxes` / `Stepper`, chosen by `CounterControl` — clickable boxes for a
  0…max counter, falling back to a stepper past 12 boxes. Spell slots store
  `used` (a filled box is expended), resources and death saves store what is
  _available_. Clicking box `i` jumps the counter to `i` or `i + 1`, so a
  multi-slot spend is one request.

**Read-only by design:** every `derived` value (initiative, the passives,
ability modifiers, save totals, skill bonuses, total level, spell save DC and
attack bonus) plus `characterName` and `race`, which the API accepts only on
create.

**Detail popovers.** Catalog-backed rows (inventory, spells, feats, features)
and conditions open a click-to-open popover. The renderers live in
`src/components/catalog-detail.tsx` and are shared with the `/catalog` browsers
— possible because the sheet's joined rows carry the full catalog types.

## The API contract

Shared response types live in `packages/shared` (`@dnd/shared`) — e.g.
`MeResponse`, `AuthResponse`, `PlayerPublic`. It is **type-only** (no build step;
erased at compile time) and mirrors the API's `select` projections. Add new DTOs
there as feature pages are built so both apps stay in sync.

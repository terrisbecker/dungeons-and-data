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

**The controls** live in `src/components/editable-fields.tsx` (shared with the
creature stat block):

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

**Inventory rows** are the one section whose rows are themselves shared with the
creature stat block, in `src/components/inventory-rows.tsx`. `InventoryItem` has
a polymorphic owner (`characterId` XOR `creatureId`) and both reads join the
full `ItemCatalog`, so the two are structurally identical; only the BFF topic
route differs, which the row takes as a `patch` callback. Each row edits
`quantity`/`equipped`/`attuned` in place — one `useOptimisticField` per column,
so a rejected write (the 3-item attunement cap answers **409**) reverts only
that field. `ReadOnlyInventoryRow` is the same row for a viewer who can't write.

## Campaign creatures (NPCs + monsters)

`src/app/(app)/campaigns/[id]/creatures/` is the DM's bestiary, reached from the
campaign sidebar. NPCs and monsters are one table discriminated by `kind`, so
one browser, one wizard and one stat block cover both.

**Browsing** (`page.tsx` + `creatures-browser.tsx`) — both **server components**.
A campaign's creatures and the shared bestiary (rows with no `campaignId`, which
every game can draw from) render as two sections. The kind/scope filters are
plain `<Link>`s that set `?kind=NPC|MONSTER` and `?scope=campaign|shared|all`, so
there is no client state and a filtered view is shareable. `creatures-data.ts`
loads the pair — the list and the viewer's write permission — via
`listCreatures(campaignId, { includeShared, kind })`.

**Creating** (`new/creature-wizard.tsx`) — Identity → Abilities → Defense →
Senses & Challenge → Review, modelled on the character wizard: one flat form
state with every number held as raw text, per-step validation that refuses to
advance, and a backwards-only stepper. It captures **only the main `Creature`
row**; the "Belongs to" step chooses between this campaign and the shared
bestiary. The kind swaps one fieldset (NPC: race/occupation/faction, monster:
source), and the unused side is written as `null` so a mid-wizard kind switch
leaves nothing stale.

**The stat block** (`[creatureId]/creature-stat-block.tsx`) — a server component
composing client sections, the same shape as the character sheet:

- **Inline editing** of every stored scalar through `useOptimisticField` +
  `PATCH /api/creatures/[id]`, including the **name** (the creature API accepts
  `name` on PATCH, unlike the character API). Postgres `text[]` columns (type
  tags, condition immunities, environment) are edited as one comma-separated
  line. Challenge rating rides the text editor rather than the number one so it
  can be written `1/4` — `parseChallengeRating` in `src/lib/creature-labels.ts`
  converts, and the same module formats it back.
- **Add / remove** sections for skills, damage modifiers and the stat-block
  entries (traits, actions, legendary actions…), which are additionally
  **editable** and grouped in Monster Manual order. They proxy through
  `/api/creature-children/[topic]`, an allowlist of exactly four topics.
- **Inventory** — the creature's loot, managed the same way. The add form
  lazy-loads the item catalog (`useLazyList` over `/api/catalog/items`) and posts
  to `inventory-items` with a **`creatureId`** owner. The rows themselves are the
  shared `components/inventory-rows.tsx` the character sheet uses (see above), so
  editing loot on a monster and on a hero are literally the same component.
  Non-managers get the same card read-only — no add form, no editors, no remove.
- **Read-only by design:** the whole `derived` block (proficiency bonus from CR,
  saves, skill bonuses, the passives).

**Placements** — a creature is assigned to a location from **either side** of the
`(creatureId, locationId)` join, and both write the same row:

- from the stat block's "Where it appears" section, and
- from `locations/location-creatures.tsx`, which replaced the location browser's
  read-only "Creatures here" list.

Each picker lazy-loads its options on first open (`src/hooks/use-lazy-list.ts`),
so neither page drags the campaign's whole bestiary or location tree along.
Writes go to `/api/creature-placements` and
`/api/creature-placements/[creatureId]/[locationId]`; the API authorizes **both**
the creature and the location, so a DM cannot drop a shared monster into another
campaign's world.

**Permission gating.** `canManageCampaign` / `canManageSharedCatalog` in
`campaigns/[id]/campaign-data.ts` mirror the API's rules (a campaign's own rows:
Admin or that campaign's DM; shared rows: Admin or a DM of any campaign) and
decide whether the write controls render at all. Any authed user can still read
every creature — the API guards remain the enforcement point.

## The API contract

Shared response types live in `packages/shared` (`@dnd/shared`) — e.g.
`MeResponse`, `AuthResponse`, `PlayerPublic`. It is **type-only** (no build step;
erased at compile time) and mirrors the API's `select` projections. Add new DTOs
there as feature pages are built so both apps stay in sync.

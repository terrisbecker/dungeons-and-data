# Frontend gap analysis (updated 2026-08-06)

An audit of `apps/web` for missing features and rough UX edges, beyond what's
already tracked in the root `CLAUDE.md` "Not yet done" list. File paths are
relative to the repo root. Items are removed from this list once fixed —
check `git log -p -- docs/frontend-gaps.md` for history rather than leaving
stale "done" entries here.

> **Resolved since the last pass:** character-sheet permission gating
> (`canManageCharacter` in `apps/web/src/app/(app)/characters/[id]/character-data.ts`),
> confirm-before-remove on every sheet row (`RemoveButton`'s `confirm` prop in
> `components/section-card.tsx`), and full campaign membership management
> (`POST /campaigns/:id/leave`, the `campaign-memberships` BFF routes,
> `roster-row.tsx`'s role toggle + remove, and a real `campaigns/[id]/settings`
> page) are all shipped. The `/catalog` CRUD manager is now documented in
> [`frontend.md`](./frontend.md) instead of flagged here as a doc gap.

## Biggest gap

**Encounters and dice rolls don't exist at all**, frontend or backend. No
`encounters/` topic folder, no dice-roll utility, no data model anywhere in
`apps/api/src/`. The sidebar link (`(app)/campaigns/[id]/encounters/page.tsx`)
still renders the shared `coming-soon.tsx` stub. This is a feature to design
from scratch, not a UI addition.

## Missing everyday niceties

- **No search or filter-by-name anywhere** — creatures have fixed Kind/Scope
  link-pills only (`campaigns/[id]/creatures/creatures-browser.tsx`); catalogs,
  locations, and dashboard lists are flat and unfiltered. Compounds the
  already-known lack of pagination.
- **No `loading.tsx`, `error.tsx`, or `not-found.tsx` anywhere** under
  `apps/web/src/app/` (confirmed: none exist in the tree) — slow fetches show
  a blank flash, bad ids fall back to Next's bare default 404, unhandled
  render errors hit the default dev/prod overlay instead of a styled card.
- **No global campaign switcher** — the sidebar
  (`campaigns/[id]/campaign-workspace.tsx`) only has in-campaign nav plus a
  single "back to dashboard" link; switching campaigns means a full trip back
  to the dashboard.
- **No avatar/portrait support anywhere** — zero `<img>` elements in the app;
  characters and creatures are pure text.

## Character/creature wizard rough edges

- A brand-new character has zero `CharacterClass` rows, so the sheet
  immediately shows "Level 0" / "No classes" until a class is added manually
  afterward.
- The "Standard array" button in the character wizard
  (`characters/new/character-wizard.tsx`) overwrites all six ability scores
  with no confirmation, even after manual edits.
- No cross-check between a creature's free-text `hitDice` (e.g. `"7d8+14"`)
  and its numeric `hitPoints` in the creature wizard — they can silently
  disagree.
- No "unsaved changes" warning when navigating away mid-wizard (no
  `beforeunload` handler anywhere in the app).

## Smaller / previously-known items (confirmed still true)

- `characterName`/`race` still can't be edited post-create — the API only
  accepts them on `POST /characters` (`requireString`; absent from
  `parseOptionalFields` on `PATCH`).
- Deleting an in-use catalog row surfaces a generic "Bad Request" toast
  (`apps/api/src/http/prisma-errors.ts` maps `P2003` with no context) instead
  of naming what still references it.
- `CreaturePlacement.quantity`/`notes`: the API and BFF already support
  `PATCH /creature-placements/:creatureId/:locationId`; only the UI control is
  missing — both `creature-placements-section.tsx` (stat block) and
  `location-creatures.tsx` (location detail) render `quantity` as static text
  after creation.
- Slot/resource writes are absolute-value, last-write-wins (no atomic
  increment) — see CLAUDE.md's "Sheet write semantics" note.

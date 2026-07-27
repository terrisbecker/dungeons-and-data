# Frontend gap analysis (2026-07-26)

An audit of `apps/web` looking for missing features and rough UX edges, beyond
what's already tracked in the root `CLAUDE.md` "Not yet done" list. Organized
by impact. File paths are relative to the repo root.

## Correction to a prior assumption

`(app)/catalog/[type]` (`apps/web/src/app/(app)/catalog/`) is **not** a
read-only viewer — it's a full CRUD manager for Item/Spell/Feat/Feature with
inline edit and a two-step arm/confirm delete, gated to DM/Admin
(`catalog/[type]/page.tsx:66-70`). More complete than the docs implied.

## Biggest gaps

1. **Encounters and dice rolls don't exist at all**, frontend or backend.
   No `encounters/` topic folder, no dice-roll utility, no data model
   anywhere in `apps/api/src/`. The sidebar link
   (`(app)/campaigns/[id]/encounters/page.tsx`) renders the shared
   `coming-soon.tsx` stub. This is a feature to design from scratch, not a UI
   addition.

2. **No read/write permission gating on the character sheet UI.**
   `(app)/characters/[id]/page.tsx` and `character-sheet.tsx` never call
   `getMe()` or compute a `canManage` flag — every section
   (`ClassesSection`, `SkillsSection`, `SpellsSection`, inventory, HP/AC
   editors, etc.) renders its full Add/Edit/Remove UI unconditionally for any
   authenticated viewer, including someone who owns neither the character nor
   its campaign. Contrast with the creature stat block and locations browser,
   which both compute `canManageCampaign`/`canManageSharedCatalog`
   (`campaigns/[id]/campaign-data.ts`) and render read-only otherwise. The
   API's `assertCanWriteCharacter` guard (`apps/api/src/auth/authz.ts:76-91`)
   still rejects the actual write with a 403, so nothing is exploitable — but
   a non-owner sees a fully "editable-looking" sheet and every click fails
   with a generic error toast.

3. **No confirmation before any character-sheet/creature-sheet row
   removal.** `components/section-card.tsx`'s `RemoveButton` (lines 81-98)
   fires `onRemove()` on a single click, no confirm step, no undo — used
   22+ times across both sheets (classes, skills, spell slots, resources,
   proficiencies, conditions, spells, feats, features, inventory,
   placements). Inconsistent with creature deletion
   (`delete-creature-dialog.tsx`), location deletion
   (`delete-location-dialog.tsx`), and catalog deletion
   (`catalog-shared.tsx`), which all require an explicit second step and
   spell out consequences.

4. **Campaign membership management is a bigger gap than it first looks.**
   The API already has full CRUD
   (`apps/api/src/campaign-memberships/campaign-memberships.routes.ts` —
   POST/GET/PATCH/DELETE `/:id`, enforcing the ≥1-DM-per-campaign invariant
   in `campaign-memberships.service.ts:50-56`), but there is **no BFF route
   for it at all** (`find apps/web/src/app/api -iname "*membership*"` → zero
   results). `apps/web/src/app/api/campaigns/` only has `route.ts` (POST,
   list) and `[id]/join/route.ts` — no `[id]/route.ts` for PATCH/DELETE
   either. Additionally, `guardMembershipByParamId`
   (`apps/api/src/auth/guards.ts:266-270`) only allows Admin or that
   campaign's DM to PATCH/DELETE a membership — **a player cannot remove
   their own seat**, so "leave campaign" needs a new self-service path, not
   just a UI control and a proxy route. Joining is also instant and
   unmoderated: the "invite code" (`invite-card.tsx`) is the raw campaign
   UUID, and there's no way to un-seat someone from the UI afterward.

## Missing everyday niceties

- No search or filter-by-name anywhere (creatures have fixed Kind/Scope
  pills only; catalogs, locations, and dashboard lists are flat and
  unfiltered) — compounds the already-known lack of pagination.
- No `loading.tsx`, `error.tsx`, or `not-found.tsx` anywhere under
  `apps/web/src/app/` — slow fetches show a blank flash, bad ids fall back
  to Next's bare default 404, unhandled render errors hit the default
  dev/prod overlay instead of a styled card.
- No global campaign switcher — the sidebar
  (`campaigns/[id]/campaign-workspace.tsx`) only has in-campaign nav plus a
  single "back to dashboard" link.
- No avatar/portrait support anywhere — zero `<img>` elements in the app;
  characters and creatures are pure text.

## Character/creature wizard rough edges

- A brand-new character has zero `CharacterClass` rows, so the sheet
  immediately shows "Level 0" and "No classes" until a class is added
  manually afterward.
- "Standard array" button in the character wizard overwrites all six
  ability scores with no confirmation, even after manual edits.
- No cross-check between a creature's free-text `hitDice` (e.g. "7d8+14")
  and its numeric `hitPoints` — they can silently disagree.
- No "unsaved changes" warning when navigating away mid-wizard.

## Smaller / previously-known items (confirmed still true)

- `characterName`/`race` still can't be edited post-create (API only
  accepts them on create).
- Deleting an in-use catalog row surfaces a generic "Bad Request" toast
  (`apps/api/src/http/prisma-errors.ts:15-16` maps `P2003` with no context)
  instead of naming what references it.
- `CreaturePlacement.quantity`/`notes`: API + BFF already support PATCH,
  only the UI control is missing.
- Slot/resource writes are absolute-value, last-write-wins (no atomic
  increment).

---

# Implementation plan: items 2, 3, 4

## 2. Character sheet permission gating

**Goal:** mirror the pattern already used for creatures/locations —
compute a `canManage` boolean server-side and render every section
read-only when it's `false`, instead of relying on the API's 403 to fail
silently.

**Why this is cheap:** `CharacterSheet` (`packages/shared/src/index.ts:563-564`)
already exposes `playerId` and `campaignId`, and `assertCanWriteCharacter`
(`apps/api/src/auth/authz.ts:76-91`) is a 3-branch rule (Admin / owning
player / campaign's DM) that's trivial to mirror client-side — exactly what
`campaign-data.ts`'s `canManageCampaign` already does for campaigns.

Steps:

1. **Add the predicate.** In `apps/web/src/app/(app)/characters/[id]/character-data.ts`
   (new file, same shape as `campaign-data.ts`):
   ```ts
   export function canManageCharacter(
     me: MeResponse,
     sheet: CharacterSheet,
   ): boolean {
     return (
       me.systemRole === "ADMIN" ||
       (sheet.playerId !== null && sheet.playerId === me.id) ||
       (sheet.campaignId !== null &&
         me.memberships.some(
           (m) =>
             m.campaign.id === sheet.campaignId && m.role === "DUNGEON_MASTER",
         ))
     );
   }
   ```
2. **Fetch `getMe()` in `page.tsx`** alongside the existing
   `getCharacterSheet(id)` call (`Promise.all`, same as the dashboard
   already does), compute `canManage`, pass it into `CharacterSheetView`.
3. **Thread it via a context, not props.** `CharacterSheetView` renders 13+
   section components; prop-drilling `canManage` through every one is
   noisy. Add `CanManageContext` (a simple `createContext(false)` +
   `useCanManage()` hook) in `character-sheet.tsx`, provide it once at the
   top, consume it in each section component internally instead of adding a
   parameter to every signature.
4. **Gate three kinds of controls** inside each section
   (`character-sheet-sections.tsx`, `character-sheet-catalog-sections.tsx`,
   `character-sheet-hub-sections.tsx`, `character-sheet-editing.tsx`):
   - `SectionCard`'s Add-toggle button and `RemoveButton` — skip rendering
     when `!canManage` (an `EmptyState`-style plain list is enough).
   - The inline editable primitives in `components/editable-fields.tsx`
     (`EditableNumber`, and its text/checkbox siblings) — read `useCanManage()`
     internally and render static text/badges instead of the clickable
     button when `false`, rather than threading a new prop through every
     call site in the sheet.
   - Spell-slot/resource "stepper" boxes and death-save ticks — same
     treatment, render as plain filled/unfilled indicators.
5. **Reuse the same context in the creature stat block** later if useful —
   it already has `canManage` prop-drilled explicitly
   (`campaigns/[id]/creatures/[creatureId]/`), so no change needed there now,
   but keep the primitive's internal read-only behavior generic enough to
   serve both.
6. **No backend change required** — this is purely rendering; the API guard
   stays the actual enforcement, the UI just stops lying about what's
   clickable.

## 3. Confirm-before-remove on sheet rows

**Goal:** every `RemoveButton` use gets a lightweight confirm step,
matching the existing `Dialog`-based pattern in
`delete-location-dialog.tsx` / `delete-creature-dialog.tsx`, without
introducing a full-page dialog import at all 22 call sites.

Steps:

1. **Extend `RemoveButton` itself** in `components/section-card.tsx` rather
   than wrapping it at each call site (keeps the fix to one file):
   ```ts
   export function RemoveButton({
     onRemove,
     confirm,       // e.g. "Remove Longsword from inventory?"
   }: {
     onRemove: () => void | Promise<void>;
     confirm?: string;
   }) { ... }
   ```
   When `confirm` is provided, wrap the same icon button as the
   `DialogTrigger` for a small inline `Dialog`/`DialogContent` (reuse
   `apps/web/src/components/ui/dialog.tsx`, already imported in
   `delete-location-dialog.tsx`) with a title built from `confirm`, Cancel
   - Remove buttons, and the existing `busy` state gating the Remove
     button. When `confirm` is omitted, fall back to the current
     fire-immediately behavior (keeps low-stakes removes, if any are
     intentionally kept snappy, opt-out-able).
2. **Pass a `confirm` string at each of the 22 call sites** — the message
   should name the specific row, e.g. in
   `character-sheet-catalog-sections.tsx`'s `InventorySection`:
   `confirm={`Remove ${row.item.name} from inventory?`}`. This is
   mechanical: one string prop added per existing `<RemoveButton onRemove=.../>`
   call across `character-sheet-sections.tsx`,
   `character-sheet-catalog-sections.tsx`, `character-sheet-hub-sections.tsx`,
   and the creature stat block's equivalent files.
3. **Skip confirmation only where removal is trivially reversible** — e.g.
   an unsaved in-progress add form's own cancel — not applicable here since
   `RemoveButton` is only used for already-persisted rows.
4. **No backend or BFF change** — purely a client-side interaction change.

## 4. Campaign membership management (BFF + UI)

**Goal:** let a DM manage their roster (promote/demote/remove a player) and
let a player leave a campaign on their own, plus expose campaign
edit/archive from the UI. The API is mostly ready; two backend pieces are
missing (self-leave, and the campaign PATCH/DELETE BFF proxy) and then the
UI is new.

Steps:

1. **Add a self-service "leave campaign" endpoint** (API), mirroring the
   existing self-service `POST /campaigns/:id/join`
   (`apps/api/src/campaigns/campaigns.routes.ts:18`):
   - `apps/api/src/campaigns/campaigns.routes.ts`: add
     `campaignsRouter.post("/:id/leave", leaveCampaign);` — **no guard**,
     exactly like `join`, since it only ever touches the caller's own row.
   - `campaigns.controller.ts`: new `leaveCampaign` handler resolving
     `req.auth.playerId` + `req.params.id` to a membership id (new query:
     `findMembershipByCampaignAndPlayer` in
     `campaign-memberships.queries.ts`, following the existing
     `campaignIdOfMembership` pattern in `authz.queries.ts`), then calling
     the **existing** `deleteMembershipService` — the ≥1-DM invariant
     (`assertNotLastDm`) already fires from that path, so a sole DM leaving
     is correctly refused with 409 with no new logic needed.
   - This is the only genuinely new backend behavior; everything else below
     is a proxy over routes that already exist.
2. **Add BFF proxy routes** under `apps/web/src/app/api/campaigns/`,
   following the exact shape of `[id]/join/route.ts` and
   `api/locations/[id]/route.ts`:
   - `[id]/route.ts` — `PATCH` (proxies `updateCampaign`) and `DELETE`
     (proxies `deleteCampaign`), both against `PATCH/DELETE /campaigns/:id`
     which already exist and are guarded by `guardCampaignByParamId`.
   - `[id]/leave/route.ts` — `POST`, proxies the new leave endpoint.
   - `memberships/[id]/route.ts` — `PATCH` (change role) and `DELETE`
     (remove a player), proxying `PATCH/DELETE /campaign-memberships/:id`
     (already guarded by `guardMembershipByParamId` — Admin or that
     campaign's DM).
   - Add the matching typed helpers in `apps/web/src/lib/api.ts`
     (`updateCampaign`, `deleteCampaign`, `leaveCampaign`,
     `updateMembership`, `deleteMembership`), same shape as
     `updateLocation`/`deleteLocation` (lines 188-202).
3. **UI: roster management on the campaign overview page**
   (`campaigns/[id]/page.tsx`), only for a DM/Admin
   (`canManageCampaign` already exists in `campaign-data.ts`):
   - Turn each roster row into a small client component
     (`membership-row.tsx`) with a role toggle (Player ⇄ DM) calling the new
     `PATCH` and a "Remove" action using the same confirm-dialog pattern as
     `delete-location-dialog.tsx` (spelling out "this removes them from the
     campaign; their characters are not deleted, just unassigned" — mirrors
     `PlayerCharacter.playerId` being `SetNull` on delete). Both surface the
     409 "last DM" case as a toast rather than a generic error.
   - Non-DM viewers keep seeing the current plain, non-interactive list.
4. **UI: "Leave campaign" for the current player** — a button on the
   overview page (or dashboard's campaign list) visible to any member who
   isn't relying on being the last DM; on 409 (last DM) show a toast
   explaining they must promote a co-DM first.
5. **UI: campaign edit/archive** — a small settings form (could finally
   give the `(app)/campaigns/[id]/settings` stub real content instead of
   `coming-soon.tsx`) using the new `PATCH`/`DELETE` proxies for
   `name`/`description`/`status` and campaign deletion, DM/Admin-gated the
   same way.
6. **Order of work:** step 1 (API) first since everything else depends on
   the leave endpoint existing; steps 2-3 (roster management) are the
   highest-value UI piece and don't depend on step 1 at all, so they can
   ship independently/first if the leave-campaign flow is lower priority.

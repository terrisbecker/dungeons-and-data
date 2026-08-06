# Economy Engine

The economy engine simulates local supply and demand for a campaign's world:
a DM sets supply/demand sliders on locations, and those sliders — combined
with a per-item-type sensitivity constant — shift an item's price away from
its `Item.baseValueCp` rulebook value. The result is only ever surfaced in
one place: a **building**'s inventory, where players see a buy price and a
sell price. Nothing else in the app ever shows a modified price; every other
inventory (character, creature) still shows the plain catalog item.

Implementation lives in `apps/api/src/inventory-items/inventory-items.derived.ts`
(the pure pricing math), `inventory-items.service.ts` (the ancestor-chain
walk that calls it), `locations/`, `location-item-economy/`,
`item-economy-configs/`, and `campaign-economy-settings/` (the four topics
that own the underlying data). The frontend lives under
`apps/web/src/app/(app)/campaigns/[id]/locations/` — see
`location-economy-sliders.tsx` and `location-building-inventory.tsx`.

## The pricing model

The model is a variation of a basic supply/demand curve, treating the
rulebook `baseValueCp` as the neutral equilibrium price (Final Price = Base
Value + Supply/Demand modification):

- Supply is constant at every price: `Q_s = c`.
- Demand decreases linearly with price: `Q_d = Q_0 - M*P`.
- Solving `Q_s = Q_d` gives the equilibrium price shift for one location:
  `(demandLevel - supplyLevel) / M`, where `demandLevel`/`supplyLevel` are
  that location's sliders and `M` (`demandSlope`) is the one configurable
  curve parameter, set **per item type** (see below) — so all `WEAPON`s
  share one slope, all `POTION`s share a different one, etc.
- **Modifiers stack additively up the location hierarchy.** A location's
  contribution is `(demandLevel - supplyLevel) / demandSlope`; the total
  modifier for an item at a given location is the sum of that contribution
  across the location itself and every ancestor up to the root. Because
  division distributes, the implementation sums the raw `(demandLevel -
supplyLevel)` deltas across the whole chain first and divides once by the
  item type's slope at the end — equivalent, and avoids compounding
  per-step rounding.
- A global (per-campaign) **floor/ceiling** clamp bounds the final price as
  a percentage of `baseValueCp` either direction (default ±50%), so no
  combination of sliders can send a price to zero or off to infinity.

```
rawDelta   = sum over (location + every ancestor) of (demandLevel - supplyLevel)
modifierCp = round(rawDelta / demandSlope)          // demandSlope is per ItemType
buyPriceCp = clamp(baseValueCp + modifierCp, floor, ceiling)
sellPriceCp = round(buyPriceCp * 0.9)                // flat 10% discount, "for now"
```

### Worked example

The Gilded Anvil (a building) sits in Thornwick, which sits in Silverpine
Forest, which sits in The Kingdom of Aldermere (the root — no further
ancestors). Suppose the sliders are:

| Location                 | supplyLevel | demandLevel | delta |
| ------------------------ | ----------- | ----------- | ----- |
| The Gilded Anvil         | 0           | 4           | +4    |
| Thornwick                | 1           | 3           | +2    |
| Silverpine Forest        | 2           | 6           | +4    |
| The Kingdom of Aldermere | 0           | 0           | 0     |

`rawDelta = 4 + 2 + 4 + 0 = 10`, the same chain for every item type — the
per-type `demandSlope` is what makes two different items react differently
to it.

- **Dagger** (`WEAPON`, `baseValueCp = 200`): `modifierCp = round(10 /
0.02) = 500` (+5 gp) against a base of just 2 gp. The default 50%/50%
  floor/ceiling caps this item at `[100, 300]`, so `200 + 500 = 700` clamps
  down to `buyPriceCp = 300`, `sellPriceCp = round(300 * 0.9) = 270`. The
  slider push is "worth" more than the item itself can absorb — the clamp,
  not the slope, is what limits the swing here.
- **Greataxe** (`WEAPON`, `baseValueCp = 3000`): the same chain, the same
  `demandSlope = 0.02`, so the same `modifierCp = 500`. Its clamp range is
  `[1500, 4500]`, comfortably wider, so it lands unclamped at `buyPriceCp =
3500`, `sellPriceCp = round(3500 * 0.9) = 3150`.

Same slider settings, same item type, same flat +5 gp modifier — but a very
different percentage effect depending on the item's own price. That's the
tradeoff of a per-_type_ (not per-_item_) slope: tune it for a "typical"
item of that type and cheaper outliers will clamp sooner, pricier ones
later.

## Data model

| Table                                           | Purpose                                                                                                                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Item.baseValueCp`                              | The unmodified rulebook reference price (already existed).                                                                                                                                                                                                    |
| `CampaignEconomySettings`                       | Per-campaign: `economyEnabled` (off by default), `floorPercent`/`ceilingPercent` (default 50/50). One row per campaign, created on first `PATCH`.                                                                                                             |
| `ItemTypeEconomyConfig`                         | Per-`ItemType`: `demandSlope` (the curve's `M`). Backend/API-managed only — no dedicated admin UI.                                                                                                                                                            |
| `Location.supplyLevel` / `Location.demandLevel` | The location's **global** sliders (-10..10), applied to every item type when the location isn't in per-item-type mode.                                                                                                                                        |
| `Location.useItemTypeEconomy`                   | The mode switch. `false` (default): the two global sliders above apply to every item type. `true`: per-`ItemType` overrides apply instead (see next row) — **only a `type: "building"` location may set this true** (see below).                              |
| `LocationItemTypeEconomy`                       | One sparse row per `(locationId, itemType)` a DM has actually touched. Only consulted when the owning location's `useItemTypeEconomy` is true; a type with **no row** is neutral (`0`/`0`) — advanced mode never falls back to the location's global sliders. |
| `InventoryItem.locationId`                      | A third polymorphic owner (alongside `characterId`/`creatureId`) — a location's stock. Exactly one owner is enforced by a DB CHECK.                                                                                                                           |

## Two slider modes, and why they're building-only

A DM can run a location's economy in one of two mutually-exclusive modes:

1. **Global** (the default, and the _only_ option for non-building
   locations): one supply slider and one demand slider apply to every item
   type at that location.
2. **Per item type** (buildings only): up to 18 independent supply/demand
   pairs, one per `ItemType` — e.g. a smithy can push `WEAPON`/`ARMOR`
   demand way up while leaving `POTION` untouched.

The restriction is enforced in `locations.service.ts`, not just the UI:

- `PATCH /locations/:id` with `useItemTypeEconomy: true` on a location whose
  `type` isn't (case-insensitively) `"building"` is a **400**.
- If a location's `type` is changed _away_ from `"building"` while
  `useItemTypeEconomy` is already true, the flag is silently reset to
  `false` in the same write — renaming a location doesn't fail just because
  economy mode happened to be on, but it also can't be left in an invalid
  state.

Why buildings only: a region/town/dungeon has no inventory of its own to
price, so a per-item-type panel there would have nothing to act on directly
— it would only ever matter through additive stacking into a descendant
building. Keeping the fine-grained control at the building level (where the
inventory actually lives) keeps the common case (one region, one general
"the market is tight" feel) to two sliders, and reserves the 18-slider panel
for the one place — a specific shop — where a DM is likely to want it.

Every location, building or not, still has its plain global sliders and
still contributes to the additive stack for any descendant building,
regardless of its own type. Only the _per-item-type panel_ is building-gated
— stacking itself is unrestricted.

## Building inventory

A location whose (trimmed, lowercased) `type` is `"building"` gets an
inventory, managed the same way as a character's or creature's (add/remove
via `InventoryItem`, editable `quantity`), with two differences:

- Every row carries a computed `pricing: { buyValueCp, sellValueCp } | null`
  — `null` only for a priceless item (`baseValueCp === null`).
- `equipped`/`attuned` don't apply to a location's stock; the API rejects
  `attuned: true` for a `locationId`-owned row with a **400**, and the UI
  hides those toggles for building rows.

When the owning campaign's economy is **off** (or has no settings row yet),
`buyValueCp` is just the unmodified `baseValueCp` and `sellValueCp` is still
90% of it — the sell discount always applies, only the supply/demand
modifier is skipped.

## API reference

| Endpoint                                                      | Notes                                                                                                                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`/`PATCH /campaign-economy-settings/:campaignId`          | `GET` returns defaults (not 404) before any save. `PATCH` upserts. Guard: Admin or that campaign's DM.                                                                         |
| `GET /item-economy-configs`                                   | List every configured `ItemTypeEconomyConfig` row (sparse — a type with no row defaults to `demandSlope = 1`).                                                                 |
| `GET`/`PATCH /item-economy-configs/:itemType`                 | `PATCH` upserts `demandSlope` (must be a positive number). Guard: Admin or any DM (same tier as the shared catalogs).                                                          |
| `PATCH /locations/:id`                                        | Accepts `supplyLevel`, `demandLevel`, `useItemTypeEconomy` alongside the existing fields. Guard: Admin or that campaign's DM.                                                  |
| `GET /location-item-economy?locationId=`                      | List a location's per-item-type overrides (sparse).                                                                                                                            |
| `PATCH`/`DELETE /location-item-economy/:locationId/:itemType` | `PATCH` upserts `supplyLevel`/`demandLevel`; `DELETE` removes the override (falls back to neutral `0`/`0`, not the global sliders). Guard: same as the location's own sliders. |
| `GET /inventory-items?locationId=`                            | Building stock, `pricing` attached per row.                                                                                                                                    |
| `POST /inventory-items` (`locationId` body field)             | Add stock. Rejects `attuned: true`.                                                                                                                                            |
| `PATCH`/`DELETE /inventory-items/:id`                         | Edit `quantity` (and `equipped`/`attuned`, disallowed here); remove a row.                                                                                                     |

## Frontend

- **Campaign settings** (`(app)/campaigns/[id]/settings`) — an "Economy"
  card with the on/off toggle and floor/ceiling percentage inputs.
- **Location detail** (`(app)/campaigns/[id]/locations/[locationId]`) — an
  "Economy" card. Non-building locations always show the two global sliders,
  no mode toggle. Building locations get a "Per item type" checkbox; toggling
  it swaps between the two-slider view and 18 labeled slider pairs (drag to
  preview, commits on release). Non-managers see the same information
  read-only.
- **Building inventory** — a managed add/remove section (only rendered for
  `type: "building"` locations) showing each row's buy/sell price.

Sliders run -10..10, step 1, and commit on release (not on every drag tick)
via the shared `useOptimisticField` hook, so dragging doesn't spam writes.

## Current demand-slope defaults

Calibrated so that one location pushing a slider fully in one direction
(`rawDelta = 10`, e.g. a single location's demand at +10 with everything
else neutral) moves a _typical_ item of that type by roughly the "target
swing" below — tuned per type so the swing is noticeable without either
dwarfing a torch's entire value or getting lost in a staff's four-digit
price tag. Adjust via `PATCH /item-economy-configs/:itemType`.

| Item type        | Typical price | Target swing @ `rawDelta=10` | `demandSlope` |
| ---------------- | ------------- | ---------------------------- | ------------- |
| Adventuring gear | 2 gp          | 1 gp                         | 0.1000        |
| Weapon           | 15 gp         | 5 gp                         | 0.0200        |
| Armor / shield   | 50 gp         | 5 gp                         | 0.0200        |
| Ammunition       | 1 gp          | 0.3 gp                       | 0.3333        |
| Potion           | 50 gp         | 5 gp                         | 0.0200        |
| Scroll           | 75 gp         | 5 gp                         | 0.0200        |
| Wand             | 500 gp        | 15 gp                        | 0.0067        |
| Rod              | 1,500 gp      | 25 gp                        | 0.0040        |
| Staff            | 1,500 gp      | 25 gp                        | 0.0040        |
| Ring             | 1,000 gp      | 20 gp                        | 0.0050        |
| Wondrous item    | 300 gp        | 10 gp                        | 0.0100        |
| Tool             | 25 gp         | 3 gp                         | 0.0333        |
| Food & drink     | 0.5 gp        | 0.1 gp                       | 1.0000        |
| Trade good       | 5 gp          | 1.5 gp                       | 0.0667        |
| Container        | 5 gp          | 1.5 gp                       | 0.0667        |
| Mount / vehicle  | 75 gp         | 5 gp                         | 0.0200        |
| Treasure         | 100 gp        | 7 gp                         | 0.0143        |
| Other            | 5 gp          | 1.5 gp                       | 0.0667        |

Because `demandSlope` is a flat per-type constant, a cheap and an expensive
item of the _same_ type see the same absolute cp swing — much bigger as a
percentage for the cheap one. The floor/ceiling clamp is what keeps that in
check.

## Design notes / edge cases

- A **shared/template location** (`campaignId` null) has no campaign, so its
  descendant buildings' pricing treats the economy as off (unmodified base
  value) regardless of any sliders set on it — there's no
  `CampaignEconomySettings` row to read.
- The ancestor walk guards against a pre-existing hierarchy cycle the same
  way `locations.service.ts`'s re-parent check does (bails out rather than
  looping forever).
- Pricing is computed on every read of a location-owned `InventoryItem` row
  (list or single), not cached or stored — it always reflects the current
  sliders, campaign settings, and demand slopes.

## See also

- [`authentication.md`](./authentication.md) — the DM/Admin guard tiers
  referenced throughout the API reference table above.
- [`creature-stat-block.md`](./creature-stat-block.md) — the `characterId`/
  `creatureId` `InventoryItem` owners this doc's `locationId` owner sits
  alongside.

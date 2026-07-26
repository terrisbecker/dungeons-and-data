# Viewing a creature stat block

A **Creature** is the reusable NPC / Monster profile (one table discriminated by
`kind` = `NPC` | `MONSTER`). Like the character reads, there are two, so the
common case stays cheap:

- **`GET /creatures/:id`** — the **core** view: stored columns + `skills` + the
  computed `derived` block. This is what `PATCH` also returns.
- **`GET /creatures/:id/sheet`** — the full **stat block**: the core view plus
  every other related table joined in (stat-block entries, damage modifiers,
  inventory, and location placements). One request, no other calls needed.

**`GET /creatures`** is the lightweight list, and it takes three optional
filters (all combinable):

| Query param          | Effect                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| `campaignId=<uuid>`  | only that campaign's creatures                                                                   |
| `includeShared=true` | also include shared-catalog creatures (`campaignId` null); on its own it narrows to _only_ those |
| `kind=NPC\|MONSTER`  | one kind                                                                                         |

With no params it returns everything. A malformed `campaignId` or an unknown
`kind` is a `400`. The list row carries `campaignId` so a client can tell a
campaign-owned creature from a shared one, and — like every other creature
endpoint — `challengeRating` comes back as a plain number.

```bash
# A DM browsing one campaign: its own creatures plus the shared bestiary.
curl -s "http://localhost:3000/creatures?campaignId=$CAMPAIGN&includeShared=true" \
  -H "authorization: Bearer $TOKEN" | jq -r '.[] | "\(.name)  \(.kind)  \(.campaignId // "shared")"'
```

The sub-resources also have their own endpoints if you'd rather fetch or edit a
single section:

- `GET /creature-skills?creatureId=…`
- `GET /stat-block-entries?creatureId=…`
- `GET /creature-damage-modifiers?creatureId=…`
- `GET /creature-placements?creatureId=…` (or `?locationId=…`)

## Seeding test data

The seed script creates a roster of Creatures (2 NPCs, 3 monsters — including a
legendary+lair Ancient Red Dragon) with full stat blocks, skills, damage
modifiers, owned loot, and location placements. It is re-runnable.

```bash
docker compose up -d db          # ensure Postgres is running
npx tsx prisma/seed.ts           # seeds every table, re-runnable
```

## Fetching the stat block

Start the API (`npm run dev`, default port 3000). First list creatures to get an
id (the list view is a lightweight summary):

```bash
curl -s http://localhost:3000/creatures | jq -r '.[] | "\(.id)  \(.kind)  \(.name)"'
```

Then fetch one creature's full stat block by id:

```bash
CID=$(curl -s http://localhost:3000/creatures | jq -r '.[0].id')
curl -s "http://localhost:3000/creatures/$CID/sheet" | jq
```

## What comes back

The stat block is a single JSON object with three parts (the core view at
`GET /creatures/:id` omits the "Joined relations" beyond `skills`):

1. **Stored columns** — name, kind, size/type/`typeTags`, alignment, AC/HP/hit
   dice, all movement modes + `hover`, ability scores, saving-throw
   proficiencies, senses, languages, condition immunities, `challengeRating`
   (a plain number; `null` = unrated), XP, legendary/lair flags, and the
   monster-only (`environment`/`source`) / NPC-only (`occupation`/`faction`/
   `race`) flavor fields.
2. **Joined relations**:
   - `skills` — skill proficiencies (`PROFICIENT` / `EXPERTISE` / `HALF`)
   - `entries` — stat-block sections keyed by `category` (traits, actions,
     legendary/lair actions, …), ordered by `sortOrder`, with `legendaryCost`
   - `damageModifiers` — vulnerabilities / resistances / immunities
   - `inventory` — join rows (`quantity`/`equipped`/`attuned`) + the joined
     `item` catalog row. This is the **full** `ItemCatalog` projection (the same
     one `GET /items` returns, weapon/armor satellites flattened in), so the UI
     can render an item's whole detail without a second request.
   - `placements` — where the creature appears (`quantity`/`notes` + the joined
     `location`)
3. **`derived`** — values computed in the service layer, never stored (see
   `src/creatures/creatures.derived.ts`):
   - `proficiencyBonus` (derived from challenge rating, not class levels)
   - `abilityModifiers` and `savingThrows` per ability
   - `skills` (per-skill modifiers, factoring proficiency/expertise/half)
   - `initiative`, `passivePerception`, `passiveInvestigation`, `passiveInsight`

### Handy jq slices

```bash
# Derived combat summary (works on the core view too)
curl -s "http://localhost:3000/creatures/$CID" \
  | jq '.derived | {proficiencyBonus, initiative, passivePerception, savingThrows}'

# Legendary actions only (sheet only)
curl -s "http://localhost:3000/creatures/$CID/sheet" \
  | jq '[.entries[] | select(.category == "LEGENDARY_ACTION") | .name]'

# Where this creature is found (sheet only)
curl -s "http://localhost:3000/creatures/$CID/sheet" \
  | jq '[.placements[] | {location: .location.locationName, quantity}]'
```

## Notes

- An unknown id returns **404**; a malformed (non-UUID) id returns **400**.
- Unlike characters, creatures are **hard-deleted** (there is no `deletedAt`
  column), so `DELETE /creatures/:id` returns **204** and a subsequent read
  returns **404**.
- Creature-owned loot goes through the shared inventory endpoint: `POST
/inventory-items` with a `creatureId` (exactly one of `characterId` /
  `creatureId` must be set); `PATCH /inventory-items/:id` then edits
  `quantity`/`equipped`/`attuned` (the owner columns are immutable). The 5e
  3-item attunement cap is enforced per owner and answers **409**. The stat
  block's Inventory section drives exactly these calls.
- A **placement** write authorizes both ends — the creature _and_ the location —
  so moving a shared monster into a campaign you don't run is a **403**. The same
  goes for `PATCH /creatures/:id` with a `campaignId`: the target scope is
  re-checked, not just the creature's current one.

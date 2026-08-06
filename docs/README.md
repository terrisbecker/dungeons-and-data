# Docs index

The root [`CLAUDE.md`](../CLAUDE.md) is the source of truth for architecture,
the data model, and current implementation state — read it first. These docs
go deeper on specific slices and deliberately don't repeat what it already
covers.

| Doc | What it covers |
| --- | --- |
| [`authentication.md`](./authentication.md) | Getting a JWT, the three roles (Admin/DM/Player), CORS, response codes. Talks directly to the API with `curl`. |
| [`character-sheet.md`](./character-sheet.md) | The `PlayerCharacter` core/sheet read shape, seeded test data, `derived` block, worked `curl`/`jq` examples. |
| [`creature-stat-block.md`](./creature-stat-block.md) | The `Creature` (NPC/Monster) core/sheet read shape — same pattern as the character sheet, plus placements and creature-owned loot. |
| [`economy-layer.md`](./economy-layer.md) | The supply/demand pricing model over building inventories: the pricing formula, data model, API reference, frontend sliders. |
| [`frontend.md`](./frontend.md) | How `apps/web` works as a BFF (JWT in an httpOnly cookie), the interactive character sheet and creature stat block, catalog management, the shared `@dnd/shared` contract. |
| [`frontend-gaps.md`](./frontend-gaps.md) | Known frontend gaps and rough edges not yet tracked in `CLAUDE.md`'s "Not yet done" list. Pruned as items ship — check git history for resolved items rather than trusting a stale copy. |

## Conventions across these docs

- **BFF** = the Next.js app acting as backend-for-frontend — the browser only
  ever calls Next, which attaches the JWT server-side.
- **Satellite tables** = 1:1 child tables of `Item` (`WeaponStats`,
  `ArmorStats`) holding type-specific stats, flattened back into the flat
  `Item`/`ItemCatalog` shape on read.
- **Derived values** = computed in the service layer on every read, never
  stored (e.g. `proficiencyBonus`, ability modifiers, armor class).
- The "core" vs "sheet"/"stat block" read split (`GET /characters/:id` vs
  `GET /characters/:id/sheet`, and the `Creature` equivalents) is the same
  shape in both feature docs on purpose — keep new topic docs consistent with
  it (overview → endpoints/shape → `curl` examples → notable invariants →
  see also) if you add one.

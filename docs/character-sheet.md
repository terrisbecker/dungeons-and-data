# Viewing a character sheet

There are two character reads, so the common case stays cheap:

- **`GET /characters/:id`** — the **core** view: stored columns + `classes` +
  `skills` + the computed `derived` block. This is what `PATCH` also returns.
- **`GET /characters/:id/sheet`** — the full **virtual character sheet**: the
  core view plus every other related table joined in (spell slots, resources,
  proficiencies, conditions, spells, feats, features, inventory). One request,
  no other calls needed to render a full sheet.

The sub-resources also have their own endpoints (e.g.
`GET /character-spells?characterId=…`) if you'd rather fetch a single section.

## Seeding test data

Five fully-populated test characters (plus the catalog rows they reference) can
be created with the seed script. It is re-runnable — characters with the same
names are deleted (cascading to their owned rows) and recreated.

```bash
docker compose up -d db          # ensure Postgres is running
npx tsx prisma/seed.ts           # prints each character's id + name
```

The five characters: **Aria Nightbreeze** (Elf Wizard 5), **Thorin Ironfist**
(Dwarf Fighter 4), **Luna Silverleaf** (Half-Elf Cleric 3), **Grommash
Skullcrusher** (Half-Orc Barbarian 6), **Pip Thistledown** (Halfling Rogue 4).

## Fetching the sheet

Start the API (`npm run dev`, default port 3000). First list characters to get
an id (the list view is a lightweight summary):

```bash
curl -s http://localhost:3000/characters | jq -r '.[] | "\(.id)  \(.characterName)"'
```

Then fetch one character's full sheet by id:

```bash
curl -s http://localhost:3000/characters/<id>/sheet | jq
```

Example — pull an id and fetch the sheet in one line:

```bash
CID=$(curl -s http://localhost:3000/characters | jq -r '.[0].id')
curl -s "http://localhost:3000/characters/$CID/sheet" | jq
```

## What comes back

The sheet is a single JSON object with three parts (the core view at
`GET /characters/:id` omits the "Joined relations" beyond `classes`/`skills`):

1. **Stored columns** — name, race/subrace, alignment, size, ability scores,
   saving-throw proficiencies, HP/AC/death saves, movement, senses, currency,
   description/background/traits, etc.
2. **Joined relations** (all owned/related tables):
   - `classes` — one row per class (multiclassing), with `spellcastingAbility`
   - `skills` — skill proficiencies (`PROFICIENT` / `EXPERTISE` / `HALF`)
   - `spellSlots` — per-level slots (`max`/`used`, `isPact`)
   - `resources` — limited-use pools (Rage, Channel Divinity, …)
   - `proficiencies` — weapon/armor/tool/language proficiencies
   - `conditions` — active status effects (with optional `level`)
   - `spells` — join rows with `known`/`prepared`/`sourceClass` + the joined
     `spell` catalog row
   - `feats` — join rows with the joined `feat` catalog row
   - `features` — join rows with per-character `notes` + the joined `feature`
   - `inventory` — join rows (`quantity`/`equipped`/`attuned`) + the joined
     `item` catalog row
3. **`derived`** — values computed in the service layer, never stored (see
   `src/characters/characters.derived.ts`):
   - `totalLevel` (sum of class levels) and `proficiencyBonus`
   - `abilityModifiers` and `savingThrows` per ability
   - `skills` (per-skill modifiers, factoring proficiency/expertise/half)
   - `initiative`, `passivePerception`, `passiveInvestigation`, `passiveInsight`
   - `spellcasting` — per casting class: `saveDc` and `attackBonus`

### Handy jq slices

```bash
# Just the derived combat/casting summary (works on the core view too)
curl -s "http://localhost:3000/characters/$CID" \
  | jq '.derived | {totalLevel, proficiencyBonus, initiative, passivePerception, spellcasting}'

# Equipped inventory (sheet only)
curl -s "http://localhost:3000/characters/$CID/sheet" \
  | jq '[.inventory[] | select(.equipped) | {item: .item.name, quantity}]'

# Prepared spells (sheet only)
curl -s "http://localhost:3000/characters/$CID/sheet" \
  | jq '[.spells[] | select(.prepared) | .spell.name]'
```

## Notes

- Soft-deleted characters (those with `deletedAt` set) return **404** here and
  are excluded from the list endpoint.
- An unknown id returns **404**; a malformed (non-UUID) id returns **400**.

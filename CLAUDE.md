# Dungeons and Data — Backend

A lightweight tool to help Dungeon Masters manage D&D games by organizing game
data in a relational database and exposing it through an Express API. On top of
the data layer sits business logic for nested locations, character management,
items/inventory, item economy (shops, chests, loot), encounters, and dice rolls.
This is the **backend only**; a separate front-end concept exists elsewhere.

## Tech stack

- **Runtime:** Node.js (ESM — `"type": "module"`), TypeScript (strict)
- **Web:** Express 5
- **ORM:** Prisma 7 with the `@prisma/adapter-pg` driver adapter (`pg`)
- **DB:** PostgreSQL
- **Tooling:** ESLint 10 (flat config) + Prettier, `tsx` for dev/watch
- **Docker:** planned per the original concept, not yet added

## Commands

```bash
npm run dev              # tsx watch — run the API with reload
npm run build            # tsc -> dist/
npm run start            # node dist/index.js (run build first)
npm run lint             # eslint .
npm run lint:fix         # eslint . --fix
npm run format           # prettier --write .
npm run prisma:generate  # regenerate Prisma Client after schema edits
npm run prisma:migrate   # prisma migrate dev — create/apply a dev migration

npx tsx prisma/seed.ts   # seed 5 fully-populated test characters (re-runnable)

docker compose up -d db  # start local Postgres (healthchecked, named volume)
docker compose down      # stop it (add -v to also drop the data volume)
```

There is no test setup yet. Copy `.env.example` to `.env`, then
`docker compose up -d db` before running the app or migrations.

**Authoring a migration with raw SQL** (e.g. CHECK constraints — Prisma has no
`@check`): `npx prisma migrate dev --name <name> --create-only`, hand-edit the
generated `migration.sql`, then `npx prisma migrate dev` to apply.

## Current state (as of 2026-07-21)

Data model complete; the full layered stack for **all PlayerCharacter-related
data** is now implemented. Working on branch `api/create-player-crud-and-routes`.

**Implemented:**

- `src/index.ts` — loads env, starts the HTTP server (`PORT`, default 3000).
- `src/app.ts` — `createApp()` mounts `express.json()`, `GET /health`, every
  topic router, then the central error middleware (registered last).
- `src/db.ts` — exports a singleton `prisma` client wired through `PrismaPg`.
- `prisma/schema.prisma` — full initial data model (see below).
- `prisma/migrations/…_init` — **first migration, applied.** Creates all 21
  tables/enums plus two hand-added CHECK constraints: ability scores 1–30
  (`PlayerCharacter`) and exactly-one-owner (`InventoryItem`).
- **HTTP foundation** (`src/http/`): `http-error.ts` (`HttpError` +
  `badRequest`/`notFound`/`conflict`), `prisma-errors.ts` (`mapPrismaError`:
  `P2025`→404, `P2002`→409, `P2003`→400), `error.middleware.ts` (generic
  responses), and `validate.ts` (hand-rolled primitive field parsers — no
  validation library, matching the "generic errors for now" stance).
- **PlayerCharacter CRUD across 15 topic folders**, each with the four
  `[topic].[layer].ts` files (flat, per the `monsters/` convention; top-level
  URLs with `characterId` in the body/query):
  - Hub: `characters/` (+ `characters.derived.ts`, pure derived-stats functions).
    Soft delete via `deletedAt`; reads filter `deletedAt: null`. Two reads:
    `GET /characters/:id` returns the lean **core** (scalars + classes + skills +
    a computed `derived` block, what `PATCH` also returns), and
    `GET /characters/:id/sheet` is the full **virtual character sheet** that
    additionally joins spell slots, resources, proficiencies, conditions, spells,
    feats, features, and inventory. See `docs/character-sheet.md`.
  - Owned children (single `id` PK, `/topic/:id`): `character-classes/`,
    `spell-slots/`, `character-resources/`, `character-skills/`,
    `proficiencies/`, `character-conditions/`, `inventory-items/`.
  - Composite-key joins (`/topic/:characterId/:otherId`): `character-spells/`,
    `character-feats/` (pure join — no PATCH), `character-features/`.
  - Catalogs (referenced by the joins): `items/`, `spells/`, `feats/`,
    `features/`. `spells/`, `feats/`, and `features/` were fleshed out from
    stubs into full 5e shapes (see the Data model section for their columns).
  - Service-layer invariants: ability scores 1–30, `inventory-items` forces the
    character owner (npcId null) and enforces the ≤3 attunement cap.
- **Seed + docs:** `prisma/seed.ts` creates 5 fully-populated test characters
  (re-runnable); `docs/character-sheet.md` documents the character-sheet curl.
- **Docker:** `docker-compose.yml` (Postgres 17), `Dockerfile` (multi-stage app
  image), `.dockerignore`.
- Config: `tsconfig.json`, `eslint.config.mjs` (adds
  `no-unused-vars` `argsIgnorePattern: "^_"`), `.prettierrc.json`,
  `prisma.config.ts`, `.env.example`.

**Not yet done:**

- No layers yet for NPC / Monster / Location (and their placements) or the
  economy/pricing layer.
- No auth, no pagination.
- No tests, no CI.

## Architecture — layered backend

Requests flow through distinct layers; keep responsibilities separated:

1. **Database layer** — PostgreSQL accessed via Prisma ORM.
2. **Query layer** — connects to the DB, defines and runs queries. Prisma calls live here.
3. **Service layer** — business logic; transforms raw data and turns requests into queries. **Derived values live here (see below).**
4. **Controller layer** — receives requests from routes, calls the right service, handles errors and request logic.
5. **Route/API layer** — defines the Express routes for each request.

### File naming conventions

Every source file is named `[topic].[layer].ts` and lives in a folder named for
the topic. Example — monster code goes in `monsters/` as `monsters.queries.ts`,
`monsters.service.ts`, `monsters.controller.ts`, `monsters.routes.ts`, etc.

## Data model (`prisma/schema.prisma`)

Conventions: **all IDs are UUID** (`@id @default(uuid()) @db.Uuid`); every
primary entity carries `createdAt`/`updatedAt`. Free-text fields (race, class
name, location type, condition name, proficiency name) are intentionally
unconstrained to keep **homebrew** open.

**Enums** encode the fixed 5e sets — `Ability`, `Alignment`, `Skill` (18,
each commented with its governing ability), `SkillProficiency`
(PROFICIENT/EXPERTISE/HALF), `SpellSchool`, `FeatureSource`, `RestType`,
`CreatureSize`. Everything homebrew-sensitive (race, class name, item/condition
names, proficiency names) stays free-text on purpose.

Models currently defined:

- **Location** — self-referencing hierarchy via `parentId` /
  `LocationHierarchy` relation (realm → region → town → building → cottage).
  Occupants attach through explicit join models.
- **PlayerCharacter** — the hub. Six ability scores as fixed `SmallInt` columns
  (stored as **final** values, post-racial/ASI); per-save proficiency booleans;
  combat (HP, `hitPointMaxModifier`, AC, death saves); movement
  (`speed`/`flySpeed`/`swimSpeed`/`climbSpeed`) and `darkvision`; concentration
  pointer; currency (5e coin types); the four roleplay boxes
  (`traits`/`ideals`/`bonds`/`flaws`); `deletedAt` soft delete. Related to
  skills, items, classes, proficiencies, spells, feats, features, conditions,
  resources, and spell slots.
- **CharacterClass** — one row per class a character has levels in (supports
  **multiclassing**); carries `hitDieSize`/`hitDiceUsed` (hit dice are
  per-class) and `spellcastingAbility`; unique on `(characterId, className)`.
- **SpellSlot** — per-level slots (1–9) with `max`/`used`; `isPact` flags
  Warlock pact magic as a separate track. Unique on `(characterId, level, isPact)`.
- **CharacterResource** — generic limited-use pool (Rage, Ki, Channel Divinity,
  Bardic Inspiration…): `current`/`max`/`rechargeOn` (`RestType`).
- **CharacterSkill** — a skill proficiency (`Skill` enum + `SkillProficiency`).
- **Proficiency** — weapon/armor/tool/language/save proficiencies.
- **Item** — shared **catalog** definition, created once and reusable across
  owners: classification (`type`/`rarity`/`isMagic`/`tags`), physical
  (`weight`/`stackable`/`consumable`/`requiresAttunement`), economy
  (`baseValueCp`), and nullable weapon/armor stat blocks. Item enums:
  `ItemType`, `ItemRarity`, `WeaponCategory`, `WeaponProperty`, `ArmorCategory`,
  `DamageType`.
  - **Cost is deliberately flexible**: `baseValueCp` is a single reference value
    in **copper** (atomic 5e unit, integer — no float drift; 1 gp = 100 cp;
    null = priceless). The future economy layer sits on top for shop/region
    pricing, buy/sell modifiers, and currency conversion — don't bake pricing
    logic into the catalog.
  - Weapon stats (`weaponCategory`, `damageDice`, `damageType`, …) and armor
    stats (`armorCategory`, `baseArmorClass`, `maxDexBonus`, …) are nullable
    columns on `Item`, populated only for the matching `type`.
- **InventoryItem** — one `Item` **assigned** to one owner with per-instance
  state (`quantity`/`equipped`/`attuned`). Owner is polymorphic via nullable FKs
  (`characterId`/`npcId`, extend with shop/chest later); **exactly one must be
  set** — enforce in the service layer (+ a CHECK constraint in the migration).
  Many rows can share an `itemId`, so a single "Shortsword" catalog row serves
  any number of characters/NPCs.
- **NPC**, **Monster** — reusable profiles placed into locations.
- **NpcPlacement**, **MonsterPlacement** — explicit M2M join models between
  NPC/Monster and Location, carrying per-placement data (notes, quantity).
- **Spell** / **CharacterSpell** — the `Spell` catalog carries full 5e spell
  data: `level`/`school`, casting details (`castingTime`/`range`/`duration`/
  `higherLevel`), V/S/M components (`verbal`/`somatic`/`material`/
  `materialComponent`), `concentration`/`ritual` flags, and structured combat
  hooks for the future combat layer (`savingThrow` `Ability?`, `damageType`
  `DamageType?`, `isAttack`). `CharacterSpell` holds per-character state
  (`known`/`prepared`/`alwaysPrepared` for domain/oath spells/`sourceClass`).
- **Feat** / **CharacterFeat** — the `Feat` catalog carries `prerequisite`,
  `repeatable`, and `grantsAbilityScoreIncrease` (half-feat marker);
  `CharacterFeat` is a pure join.
- **Feature** / **CharacterFeature** — generalized class/subclass/racial/
  background features tagged by `FeatureSource`, with `level` (gained-at level;
  null for racial/background) and free-text `subtype` (e.g. "Wizard", "School of
  Evocation"); unique on `(name, source)`.
- **CharacterCondition** — active status effects (poisoned, prone, exhaustion),
  with optional `level` for stacking.

> The original spec (see `Dungeons and Data.md`) suggested a couple of simpler
> shapes (e.g. NPCs/monsters as an array of IDs on Location, class as a single
> column). The schema deliberately went relational instead: explicit join
> models and a `CharacterClass` relation. Prefer this relational approach when
> extending.

### Derived values — do NOT store, compute in the service layer

To avoid drift, the schema intentionally omits values that are functions of
other columns. Compute these in the service layer:

- `proficiencyBonus`, `initiative`, passive scores (Perception, etc.).
- **Total character level** = sum of `CharacterClass.level` (not stored on `PlayerCharacter`).
- Ability **modifiers** from ability scores; **spell save DC** and **spell
  attack bonus** from `CharacterClass.spellcastingAbility` + prof bonus.
- Attunement cap (5e allows max 3 attuned items) — enforce in service logic, not the DB.

## TypeScript / Node / Express / Prisma / Postgres reference

General best practices to lean on when building out this codebase:

**ESM + TypeScript**

- The project is ESM (`"type": "module"`, `module`/`moduleResolution: NodeNext`).
  **Relative imports must include the `.js` extension** even in `.ts` source
  (e.g. `import { createApp } from "./app.js";`). This is already the pattern in `src/`.
- `strict` is on — no implicit `any`, handle `null`/`undefined` explicitly.

**Express 5**

- Express 5 automatically forwards rejected promises from async route handlers
  to error middleware, so `async` handlers no longer need manual `try/catch →
next(err)` wrappers (though explicit error handling is still fine).
- Register a centralized error-handling middleware (`(err, req, res, next)`)
  once the controller layer exists; keep controllers thin.
- `express.json()` is already mounted for request-body parsing.

**Prisma**

- Instantiate **one** `PrismaClient` for the whole app (already done in
  `src/db.ts`) — never `new PrismaClient()` per request; it exhausts DB
  connections. Import the shared `prisma` singleton.
- This project uses the **driver-adapter** setup (`PrismaPg` + `pg`), so the
  connection string is supplied via the adapter / `prisma.config.ts`, and the
  `datasource` block in the schema has no inline `url`.
- After any `schema.prisma` change: `npm run prisma:generate`, then create a
  migration with `npm run prisma:migrate`.
- Use nested writes and `select`/`include` to avoid N+1 queries; wrap
  multi-step writes in `prisma.$transaction`.
- Prefer explicit `select` in the query layer so responses don't leak columns.

**Postgres**

- UUID PKs are the convention here; keep using `@db.Uuid`.
- Add indexes for frequent lookup/foreign-key columns as query patterns emerge.
- Money/coins are integers (copper…platinum) — keep currency as integers, never floats.

**Config & secrets**

- `.env` is gitignored; `.env.example` is the template. Never commit real secrets.
- Env is read via `dotenv` (`import "dotenv/config"`). Fail fast on missing
  required vars (see the `DATABASE_URL` guard in `src/db.ts`).

## Conventions when adding code

- Follow the `[topic].[layer].ts` naming and one-folder-per-topic layout.
- Keep the layer boundaries: routes → controllers → services → queries → Prisma.
  Don't call Prisma directly from controllers or routes.
- Run `npm run lint` and `npm run format` before finishing a change.
- Match existing style: double quotes, semicolons, trailing commas, 2-space
  indent, 80-col width (enforced by Prettier).

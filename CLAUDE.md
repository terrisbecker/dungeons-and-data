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

npx tsx prisma/seed.ts   # seed every table: characters, locations, creatures (re-runnable)

docker compose up -d db  # start local Postgres (healthchecked, named volume)
docker compose down      # stop it (add -v to also drop the data volume)
```

There is no test setup yet. Copy `.env.example` to `.env`, then
`docker compose up -d db` before running the app or migrations.

**Authoring a migration with raw SQL** (e.g. CHECK constraints — Prisma has no
`@check`): `npx prisma migrate dev --name <name> --create-only`, hand-edit the
generated `migration.sql`, then `npx prisma migrate dev` to apply.

## Current state (as of 2026-07-23)

Data model complete; the full layered stack for **all PlayerCharacter-related
data** and **all Creature (NPC/Monster) + Location data** is implemented, plus a
**JWT auth + role-based authorization** layer and the `Player`/`Campaign`/
`CampaignMembership` CRUD that backs it. Working on branch `feat/auth`.

**Implemented:**

- `src/index.ts` — loads env, starts the HTTP server (`PORT`, default 3000).
- `src/app.ts` — `createApp()` mounts `express.json()`, the public `GET /health`
  and `/auth` routes, then the global `requireAuth` gate, then every topic
  router, then the central error middleware (registered last). Order matters:
  register/login and health stay above `requireAuth`; everything below needs a
  valid JWT.
- `src/db.ts` — exports a singleton `prisma` client wired through `PrismaPg`.
- `prisma/schema.prisma` — full initial data model (see below).
- `prisma/migrations/…_init` — squashed baseline migration, applied. The earlier
  incremental migrations (`…_init`, `…_flesh_out_pc_catalogs`,
  `…_break_out_item_stats`, `…_flesh_out_creatures`) were collapsed into one
  fresh `…_init` reflecting the schema (23 tables). The baseline still _creates_
  three hand-added CHECK constraints (Prisma has no `@check`), but a follow-up
  migration (`…_drop_ability_score_checks`) drops two of them, so only **one**
  CHECK is live: the exactly-one-owner rule on `InventoryItem` (`characterId`
  XOR `creatureId`) — a relational invariant worth guarding in the DB. The
  ability-score 1–30 bounds on `PlayerCharacter`/`Creature` are now owned solely
  by the service layer (a 5e _rules_ limit, kept relaxable for homebrew).
  **Prefer plain additive `prisma migrate dev` going forward — do NOT rebaseline
  the history** (the old squash-and-re-append-CHECKs dance is what forced
  hand-written SQL each time; additive migrations leave the existing constraint
  untouched and stay fully Prisma-generated). The only remaining hand-SQL case
  is adding/removing a CHECK, since Prisma can't diff them. A later additive
  `…_add_auth_to_player` migration followed exactly this discipline (added
  `passwordHash`/`systemRole` to `Player`, and created the `Player`/`Campaign`/
  `CampaignMembership` tables that were in the schema but never migrated).
- **HTTP foundation** (`src/http/`): `http-error.ts` (`HttpError` +
  `badRequest`/`notFound`/`conflict`/`unauthorized`/`forbidden`),
  `prisma-errors.ts` (`mapPrismaError`: `P2025`→404, `P2002`→409, `P2003`→400),
  `error.middleware.ts` (generic responses), and `validate.ts` (hand-rolled
  primitive field parsers — no validation library, matching the "generic errors
  for now" stance).
- **Auth + authorization** (`src/auth/`): the `Player` model doubles as the user
  account (no separate `User` table). Three roles:
  - **Admin** — global; `SystemRole.ADMIN` on `Player`, carried in the JWT.
  - **Dungeon Master** — per-campaign; a `CampaignMembership` with
    `role = DUNGEON_MASTER`. Resolved live from the DB per request (not in the
    token) so membership changes take effect immediately.
  - **Player** — the default authenticated user; may CRUD their own
    character(s) (`PlayerCharacter.playerId === self`). Any authed user may READ
    everything.

  Passwords are hashed with the built-in `crypto.scrypt` (`password.ts`, stored
  `salt:hash`, no dependency); JWTs use `jsonwebtoken` (`jwt.ts`, fail-fast on
  `JWT_SECRET` like `db.ts`, `JWT_EXPIRES_IN` default `7d`). `auth.middleware.ts`
  exposes `requireAuth` (Bearer → `req.auth`); public `authRouter` serves
  `POST /auth/register` (always a plain `USER`) and `/login`. **Authorization is
  enforced by route-level guard middleware** (`guards.ts`, one line per mutating
  route) that reads ids from params/body, resolves ownership via `authz.queries.ts`
  (walks each resource up to its owning campaign/player), and calls the
  assertions in `authz.ts` — so the ~20 existing business services stay
  untouched. Shared catalogs (`Item`/`Spell`/`Feat`/`Feature` and null-campaign
  `Creature`/`Location`) are writable by **Admin or any DM**
  (`assertCanWriteCatalog`); a specific campaign's data by **Admin or that
  campaign's DM**; a character (and its owned children) by **Admin, the
  campaign's DM, or the owning player**.

- **Player / Campaign / CampaignMembership CRUD** (`players/`, `campaigns/`,
  `campaign-memberships/`): account creation lives in `/auth/register`;
  `players/` manages existing rows (never selects `passwordHash`; only Admin
  changes a `systemRole` or deletes). Creating a campaign auto-seats the creator
  as its `DUNGEON_MASTER`. Membership edits/removal enforce the **≥1 DM per
  campaign** invariant in the service layer (refuse to demote/remove the last
  DM → 409). `campaignId` is now settable on `creatures`/`locations` so
  campaign-scoping actually persists.
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
  - Service-layer invariants: ability scores 1–30; `inventory-items` requires
    exactly one owner (`characterId` XOR `creatureId`) and enforces the ≤3
    attunement cap per owner.
- **Creature CRUD across 6 topic folders**, mirroring the PlayerCharacter
  conventions (flat `[topic].[layer].ts`; top-level URLs with `creatureId` in
  the body/query):
  - Hub: `creatures/` (+ `creatures.derived.ts`, pure derived-stats functions —
    proficiency bonus from **CR**, not class level; no spellcasting block).
    **Hard delete** (no `deletedAt` on Creature). Two reads mirror the character
    hub: `GET /creatures/:id` returns the lean **core** (scalars + skills + a
    computed `derived` block, what `PATCH` also returns), and
    `GET /creatures/:id/sheet` is the full **stat block** that additionally
    joins stat-block entries, damage modifiers, inventory, and placements. The
    service normalizes `challengeRating` (Prisma `Decimal`) to a plain number.
    See `docs/creature-stat-block.md`.
  - Owned children (single `id` PK, `/topic/:id`, list by `?creatureId`):
    `creature-skills/`, `stat-block-entries/`, `creature-damage-modifiers/`.
  - Composite-key join (`/creature-placements/:creatureId/:locationId`):
    `creature-placements/` — carries `quantity`/`notes`, so it keeps PATCH;
    lists by `?creatureId` **or** `?locationId`.
- **Location CRUD** (`locations/`) — standalone catalog with the self-nesting
  hierarchy; the detail read (`GET /locations/:id`) includes `parent`/`children`
  summaries and the creatures placed there.
- **Seed + docs:** `prisma/seed.ts` populates **every table** (re-runnable): the
  catalog rows, 5 fully-populated test characters, a nested `Location` hierarchy
  (realm → region → town/dungeon → building), and 5 `Creature`s (2 NPCs, 3
  monsters incl. a legendary+lair Ancient Red Dragon) with stat-block entries,
  skills, damage modifiers, owned inventory, and location placements. It also
  seeds **auth fixtures**: an Admin (from `ADMIN_USERNAME`/`ADMIN_PASSWORD`), a
  demo DM (`dm_seed`) and player (`player_seed`), and a demo `Campaign` with both
  seated — then back-fills ownership onto the characters/locations and the two
  NPCs (the three monsters stay shared/null-campaign) so every authorization path
  is exercisable. `docs/character-sheet.md` and `docs/creature-stat-block.md`
  document the character-sheet and creature stat-block curls.
- **Docker:** `docker-compose.yml` (Postgres 17), `Dockerfile` (multi-stage app
  image), `.dockerignore`.
- Config: `tsconfig.json`, `eslint.config.mjs` (adds
  `no-unused-vars` `argsIgnorePattern: "^_"`), `.prettierrc.json`,
  `prisma.config.ts`, `.env.example` (now also documents `JWT_SECRET`,
  `JWT_EXPIRES_IN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`).

**Not yet done:**

- No economy/pricing layer (shops, chests, buy/sell modifiers, currency
  conversion) on top of the `Item.baseValueCp` catalog reference value.
- No pagination. Auth is JWT-only (no refresh tokens, no revocation/blocklist —
  a token stays valid until it expires even if the account is later demoted).
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
`CreatureSize` — plus the org/auth sets: `SystemRole` (USER/ADMIN, the global
role), `CampaignRole` (DUNGEON_MASTER/PLAYER, the per-campaign role), and
`CampaignStatus`. Everything homebrew-sensitive (race, class name, item/condition
names, proficiency names) stays free-text on purpose.

Models currently defined:

- **Player** — a real person / user account (distinct from `PlayerCharacter`,
  the in-world hero). Doubles as the auth account: `username` (unique handle),
  `passwordHash` (nullable — a DM can make a login-less placeholder; never
  selected outside login), and `systemRole`. Owns characters and joins campaigns
  via `CampaignMembership`.
- **Campaign** — one running game; the scope for campaign-owned `PlayerCharacter`,
  `Location`, and `Creature` rows (shared catalogs are NOT scoped). The DM is not
  a column — it is the membership whose role is `DUNGEON_MASTER` (supports
  co-DMs). "≥1 DM per campaign" is a service-layer invariant.
- **CampaignMembership** — a Player's seat at a Campaign, carrying their
  `CampaignRole`. Unique on `(campaignId, playerId)`.
- **Location** — self-referencing hierarchy via `parentId` /
  `LocationHierarchy` relation (realm → region → town → building → cottage).
  Occupants attach through explicit join models.
- **PlayerCharacter** — the hub. Six ability scores as fixed `SmallInt` columns
  (stored as **final** values, post-racial/ASI); per-save proficiency booleans;
  combat (HP, `hitPointMaxModifier`, AC, death saves); movement
  (`speed`/`flySpeed`/`swimSpeed`/`climbSpeed`) and `darkvision`; concentration
  pointer; currency (5e coin types); the four roleplay boxes
  (`traits`/`ideals`/`bonds`/`flaws`); `deletedAt` soft delete. Nullable
  `playerId`/`campaignId` (both `SetNull` on delete) tie it to its owner and game
  — the pair authorization walks up to. Related to skills, items, classes,
  proficiencies, spells, feats, features, conditions, resources, and spell slots.
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
  (`weight`/`stackable`/`consumable`/`requiresAttunement`), and economy
  (`baseValueCp`). Type-specific stats live in 1:1 **satellite** tables, not on
  `Item` (see below). Item enums: `ItemType`, `ItemRarity`, `WeaponCategory`,
  `WeaponProperty`, `ArmorCategory`, `DamageType`.
  - **Cost is deliberately flexible**: `baseValueCp` is a single reference value
    in **copper** (atomic 5e unit, integer — no float drift; 1 gp = 100 cp;
    null = priceless). The future economy layer sits on top for shop/region
    pricing, buy/sell modifiers, and currency conversion — don't bake pricing
    logic into the catalog.
- **WeaponStats** / **ArmorStats** — 1:1 satellites of `Item` keyed by `itemId`
  (PK = FK, `onDelete: Cascade`), holding the stat blocks that used to be
  nullable columns on `Item`. A `WEAPON` has exactly one `WeaponStats` row
  (`weaponCategory`/`damageDice`/`damageType` are NOT NULL; `versatileDamage`/
  `weaponProperties`/`rangeNormal`/`rangeLong` optional); `ARMOR` (incl. shields)
  has one `ArmorStats` row (`armorCategory`/`baseArmorClass` NOT NULL; dex/STR/
  stealth fields optional); every other type has neither. This keeps the base
  row lean (no sea of nulls). The **type ⟺ stat block** pairing is a service-
  layer invariant (`items.service.ts` — same discipline as ability-score
  ranges / attunement cap); Prisma can't express it. Reads join the satellites
  and the service **flattens** them back into the flat `Item` response shape.
  Add further per-type stats the same way (e.g. `ContainerStats`) rather than
  widening `Item`.
- **InventoryItem** — one `Item` **assigned** to one owner with per-instance
  state (`quantity`/`equipped`/`attuned`). Owner is polymorphic via nullable FKs
  (`characterId`/`creatureId`, extend with shop/chest later); **exactly one must
  be set** — enforce in the service layer (+ a CHECK constraint in the migration).
  Many rows can share an `itemId`, so a single "Shortsword" catalog row serves
  any number of characters/creatures.
- **Creature** — the reusable **NPC/Monster** profile. NPCs and monsters share
  an identical 5e stat block, so they are **one table discriminated by `kind`**
  (`CreatureKind` NPC | MONSTER); NPC-only (`occupation`/`faction`/`race`) and
  Monster-only (`challengeRating`/`experiencePoints`/`environment`/`source`/
  legendary+lair) fields sit alongside as nullable columns. Mirrors
  `PlayerCharacter` conventions: `@db.SmallInt` ability scores (1–30 enforced in
  the service layer), six save-proficiency booleans; plus header
  (`size`/`creatureType` enum +
  free-text `typeTags`/`alignmentNote`), defense (`armorClass`/`hitPoints`/
  `hitDice`), all movement modes + `hover`, senses (darkvision/blindsight/
  tremorsense/truesight + `blindBeyond`), free-text `languages`/
  `conditionImmunities`. Derived-not-stored discipline as usual (proficiency
  bonus from CR, save/skill bonuses, passive Perception). Child tables:
  **StatBlockEntry** (one polymorphic table keyed by `StatBlockEntryCategory` —
  traits/actions/legendary/lair/… as free-text MM prose, text-only for now; add
  structured attack columns later like `Spell`'s combat hooks),
  **CreatureSkill** (mirrors `CharacterSkill`), **CreatureDamageModifier**
  (vuln/resist/immunity + optional `damageType`/qualifier `note`). Spellcasting
  is just a `TRAIT` entry for now (no creature↔`Spell` join yet). Nullable
  `campaignId` (`Cascade` on delete): null = a shared catalog creature (writable
  by Admin or any DM); non-null = campaign-owned (writable by that campaign's
  DM). `Location` carries the same nullable `campaignId` with the same rule.
- **CreaturePlacement** — the single explicit M2M join model between `Creature`
  and `Location` (replaced the separate `NpcPlacement`/`MonsterPlacement`),
  carrying per-placement `quantity`/`notes`.
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
  Don't call Prisma directly from controllers or routes. (Authorization is the
  one intentional exception: `src/auth/guards.ts` middleware calls the `authz`
  service/query layer directly, keeping auth out of the business services.)
- **Every new mutating route (POST/PATCH/DELETE) needs an authorization guard**
  from `src/auth/guards.js`, wired in the `.routes.ts` file between the path and
  handler; GET routes need none (the global `requireAuth` already covers reads).
  Reuse an existing guard or add one there and a matching resolver in
  `authz.queries.ts` — don't scatter auth checks into services.
- Run `npm run lint` and `npm run format` before finishing a change.
- Match existing style: double quotes, semicolons, trailing commas, 2-space
  indent, 80-col width (enforced by Prettier).

// Shared API contract — the response shapes the Express API returns, consumed by
// the web app (and available to the API). Type-only: everything here is erased at
// compile time, so there is no build step and no runtime dependency. Keep these
// in sync with the API's `select` projections (e.g. src/auth/auth.queries.ts).

export type SystemRole = "USER" | "ADMIN";
export type CampaignRole = "DUNGEON_MASTER" | "PLAYER";
export type CampaignStatus =
  "PLANNING" | "ACTIVE" | "ON_HIATUS" | "COMPLETED" | "ARCHIVED";

// A Player as exposed publicly — never includes the password hash. Dates are
// serialized as ISO strings over the wire.
export interface PlayerPublic {
  id: string;
  username: string;
  displayName: string | null;
  systemRole: SystemRole;
  createdAt: string;
  updatedAt: string;
}

// POST /auth/register and /auth/login.
export interface AuthResponse {
  token: string;
  player: Pick<PlayerPublic, "id" | "username" | "systemRole">;
}

export interface Membership {
  id: string;
  role: CampaignRole;
  joinedAt: string;
  campaign: { id: string; name: string; status: CampaignStatus };
}

// GET /auth/me — the current player plus their campaign memberships.
export interface MeResponse extends PlayerPublic {
  memberships: Membership[];
}

// A campaign with its roster — the detail shape returned by POST /campaigns and
// GET /campaigns/:id (mirrors campaignDetailSelect in campaigns.queries.ts).
export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  memberships: Array<{
    id: string;
    role: CampaignRole;
    joinedAt: string;
    player: { id: string; username: string; displayName: string | null };
  }>;
}

// description is deliberately non-nullable here: updateCampaignService reads
// it with optionalString (not nullableString), so an explicit null is a no-op
// on the API, not a clear — send "" to blank it out instead.
export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  status?: CampaignStatus;
}

// PATCH/DELETE /campaign-memberships/:id — mirrors the `select` in
// campaign-memberships.queries.ts (a standalone membership row, unlike the
// nested shapes above).
export interface CampaignMembership {
  id: string;
  campaignId: string;
  playerId: string;
  role: CampaignRole;
  joinedAt: string;
  player: { id: string; username: string; displayName: string | null };
}

export interface UpdateMembershipInput {
  role?: CampaignRole;
}

// GET/PATCH /campaign-economy-settings/:campaignId — the economy engine's
// on/off toggle and global price floor/ceiling for a campaign (mirrors
// campaign-economy-settings.queries.ts's select). Defaulted (not 404) when a
// campaign hasn't saved settings yet.
export interface CampaignEconomySettings {
  campaignId: string;
  economyEnabled: boolean;
  floorPercent: number;
  ceilingPercent: number;
}

export interface UpdateCampaignEconomySettingsInput {
  economyEnabled?: boolean;
  floorPercent?: number;
  ceilingPercent?: number;
}

// A lean PlayerCharacter as returned by GET /characters (mirrors
// characterListSelect in characters.queries.ts). alignment/size are enums on the
// API, typed loosely here since the dashboard list only renders race/HP/AC.
export interface CharacterSummary {
  id: string;
  characterName: string;
  race: string;
  subrace: string | null;
  alignment: string | null;
  size: string | null;
  maxHitPoints: number;
  currentHitPoints: number;
  armorClass: number;
  playerId: string | null;
  campaignId: string | null;
  totalLevel: number;
  createdAt: string;
  updatedAt: string;
}

// --- Locations -------------------------------------------------------------

export type CreatureKind = "NPC" | "MONSTER";

// The lightweight projection the API reuses for a location's parent/children
// (locationSummarySelect in locations.queries.ts).
export interface LocationSummary {
  id: string;
  locationName: string;
  type: string;
}

// GET /locations (and the POST/PATCH responses) — mirrors locationSelect.
// Named LocationRow rather than Location so it doesn't shadow the DOM global.
export interface LocationRow {
  id: string;
  locationName: string;
  description: string | null;
  // Free text on purpose (realm, region, town, dungeon, …) — homebrew stays open.
  type: string;
  campaignId: string | null;
  parentId: string | null;
  parent: LocationSummary | null;
  children: LocationSummary[];
  // Economy engine sliders (DM-set). A location whose (trimmed, lowercased)
  // `type` is "building" gets a building inventory in the frontend — see
  // isBuildingType() in lib/location-labels.ts. supplyLevel/demandLevel are
  // the global fallback, used for every item type when useItemTypeEconomy is
  // false; when true, per-type overrides come from LocationItemTypeEconomy
  // (GET /location-item-economy?locationId=) instead — see that type below.
  supplyLevel: number;
  demandLevel: number;
  useItemTypeEconomy: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET /location-item-economy?locationId= — one row per ItemType a DM has
// adjusted for this location (sparse; a type with no row is neutral, 0/0).
// Only consulted when the owning LocationRow.useItemTypeEconomy is true.
export interface LocationItemTypeEconomy {
  locationId: string;
  itemType: ItemType;
  supplyLevel: number;
  demandLevel: number;
}

export interface UpdateLocationItemTypeEconomyInput {
  supplyLevel?: number;
  demandLevel?: number;
}

// GET /locations/:id — locationDetailSelect adds the creatures placed here.
export interface LocationDetail extends LocationRow {
  creaturePlacements: Array<{
    quantity: number;
    notes: string | null;
    creature: { id: string; name: string; kind: CreatureKind };
  }>;
}

export interface CreateLocationInput {
  locationName: string;
  type: string;
  description?: string | null;
  parentId?: string | null;
  campaignId?: string | null;
  supplyLevel?: number;
  demandLevel?: number;
  useItemTypeEconomy?: boolean;
}

// A location never changes campaigns from the UI, so campaignId is create-only.
export type UpdateLocationInput = Partial<
  Omit<CreateLocationInput, "campaignId">
>;

// --- Character creation + sheet -------------------------------------------

// The fixed 5e enum sets, mirrored from the Prisma schema as string unions.
export type Ability = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
export type Alignment =
  "LG" | "NG" | "CG" | "LN" | "TN" | "CN" | "LE" | "NE" | "CE";
export type CreatureSize =
  "TINY" | "SMALL" | "MEDIUM" | "LARGE" | "HUGE" | "GARGANTUAN";
export type Skill =
  | "ACROBATICS"
  | "ANIMAL_HANDLING"
  | "ARCANA"
  | "ATHLETICS"
  | "DECEPTION"
  | "HISTORY"
  | "INSIGHT"
  | "INTIMIDATION"
  | "INVESTIGATION"
  | "MEDICINE"
  | "NATURE"
  | "PERCEPTION"
  | "PERFORMANCE"
  | "PERSUASION"
  | "RELIGION"
  | "SLEIGHT_OF_HAND"
  | "STEALTH"
  | "SURVIVAL";
export type SkillProficiency = "PROFICIENT" | "EXPERTISE" | "HALF";
export type RestType = "SHORT" | "LONG";
export type SpellSchool =
  | "ABJURATION"
  | "CONJURATION"
  | "DIVINATION"
  | "ENCHANTMENT"
  | "EVOCATION"
  | "ILLUSION"
  | "NECROMANCY"
  | "TRANSMUTATION";
export type FeatureSource =
  "RACE" | "CLASS" | "SUBCLASS" | "BACKGROUND" | "FEAT";
export type DamageType =
  | "ACID"
  | "BLUDGEONING"
  | "COLD"
  | "FIRE"
  | "FORCE"
  | "LIGHTNING"
  | "NECROTIC"
  | "PIERCING"
  | "POISON"
  | "PSYCHIC"
  | "RADIANT"
  | "SLASHING"
  | "THUNDER";
export type ItemType =
  | "ADVENTURING_GEAR"
  | "WEAPON"
  | "ARMOR"
  | "AMMUNITION"
  | "POTION"
  | "SCROLL"
  | "WAND"
  | "ROD"
  | "STAFF"
  | "RING"
  | "WONDROUS_ITEM"
  | "TOOL"
  | "FOOD_AND_DRINK"
  | "TRADE_GOOD"
  | "CONTAINER"
  | "MOUNT_OR_VEHICLE"
  | "TREASURE"
  | "OTHER";
export type ItemRarity =
  "COMMON" | "UNCOMMON" | "RARE" | "VERY_RARE" | "LEGENDARY" | "ARTIFACT";
export type WeaponCategory = "SIMPLE" | "MARTIAL";
export type WeaponProperty =
  | "AMMUNITION"
  | "FINESSE"
  | "HEAVY"
  | "LIGHT"
  | "LOADING"
  | "RANGE"
  | "REACH"
  | "SPECIAL"
  | "THROWN"
  | "TWO_HANDED"
  | "VERSATILE";
export type ArmorCategory = "LIGHT" | "MEDIUM" | "HEAVY" | "SHIELD";

// A class a character has levels in (POST /character-classes). `characterId` is
// added by the creation flow, so the wizard omits it here.
export interface CharacterClassInput {
  className: string;
  subclass?: string | null;
  level: number;
  hitDieSize: number; // 6, 8, 10, 12
  spellcastingAbility?: Ability | null;
}

// A skill proficiency (POST /character-skills), sans characterId.
export interface CharacterSkillInput {
  skill: Skill;
  proficiency: SkillProficiency;
}

// A per-level spell slot track (POST /spell-slots), sans characterId.
export interface SpellSlotInput {
  level: number; // 1–9
  max: number;
  used?: number;
  isPact?: boolean;
}

// A limited-use resource pool (POST /character-resources), sans characterId.
export interface CharacterResourceInput {
  name: string;
  current: number;
  max: number;
  rechargeOn?: RestType;
}

// A weapon/armor/tool/language/save proficiency (POST /proficiencies).
export interface ProficiencyInput {
  type: string;
  name: string;
}

// An active status effect (POST /character-conditions), sans characterId.
export interface CharacterConditionInput {
  name: string;
  level?: number | null;
  notes?: string | null;
}

// --- Catalogs (Item / Spell / Feat / Feature) ------------------------------
// DMs and Admins author these shared, reusable rows; players attach existing
// ones to characters via the join tables below.

// GET /items — the flat item shape (the service folds the 1:1 weapon/armor
// satellites back into this single object; both groups are null on other types).
export interface ItemCatalog {
  id: string;
  name: string;
  description: string | null;
  type: ItemType;
  rarity: ItemRarity;
  isMagic: boolean;
  tags: string[];
  requiresAttunement: boolean;
  weight: number | null;
  stackable: boolean;
  consumable: boolean;
  baseValueCp: number | null;
  // Weapon satellite (present only when type === "WEAPON").
  weaponCategory?: WeaponCategory | null;
  damageDice?: string | null;
  damageType?: DamageType | null;
  versatileDamage?: string | null;
  weaponProperties?: WeaponProperty[] | null;
  rangeNormal?: number | null;
  rangeLong?: number | null;
  // Armor satellite (present only when type === "ARMOR").
  armorCategory?: ArmorCategory | null;
  baseArmorClass?: number | null;
  addDexToArmorClass?: boolean | null;
  maxDexBonus?: number | null;
  strengthRequirement?: number | null;
  stealthDisadvantage?: boolean | null;
}

// GET /spells.
export interface SpellCatalog {
  id: string;
  name: string;
  level: number;
  school: SpellSchool | null;
  description: string | null;
  castingTime: string | null;
  range: string | null;
  duration: string | null;
  higherLevel: string | null;
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  materialComponent: string | null;
  concentration: boolean;
  ritual: boolean;
  savingThrow: Ability | null;
  damageType: DamageType | null;
  isAttack: boolean;
}

// GET /feats.
export interface FeatCatalog {
  id: string;
  name: string;
  description: string | null;
  prerequisite: string | null;
  repeatable: boolean;
  grantsAbilityScoreIncrease: boolean;
}

// GET /features.
export interface FeatureCatalog {
  id: string;
  name: string;
  source: FeatureSource;
  description: string | null;
  level: number | null;
  subtype: string | null;
}

// POST /items — `name` required; the weapon/armor groups are validated against
// `type` by the service (WEAPON requires its three, ARMOR requires its two).
export interface CreateItemInput {
  name: string;
  description?: string | null;
  type?: ItemType;
  rarity?: ItemRarity;
  isMagic?: boolean;
  tags?: string[];
  requiresAttunement?: boolean;
  weight?: number | null;
  stackable?: boolean;
  consumable?: boolean;
  baseValueCp?: number | null;
  weaponCategory?: WeaponCategory;
  damageDice?: string;
  damageType?: DamageType;
  versatileDamage?: string;
  weaponProperties?: WeaponProperty[];
  rangeNormal?: number;
  rangeLong?: number;
  armorCategory?: ArmorCategory;
  baseArmorClass?: number;
  addDexToArmorClass?: boolean;
  maxDexBonus?: number;
  strengthRequirement?: number;
  stealthDisadvantage?: boolean;
}

// POST /spells.
export interface CreateSpellInput {
  name: string;
  level: number; // 0–9
  school?: SpellSchool;
  description?: string;
  castingTime?: string;
  range?: string;
  duration?: string;
  higherLevel?: string;
  verbal?: boolean;
  somatic?: boolean;
  material?: boolean;
  materialComponent?: string;
  concentration?: boolean;
  ritual?: boolean;
  savingThrow?: Ability;
  damageType?: DamageType;
  isAttack?: boolean;
}

// POST /feats.
export interface CreateFeatInput {
  name: string;
  description?: string;
  prerequisite?: string;
  repeatable?: boolean;
  grantsAbilityScoreIncrease?: boolean;
}

// POST /features.
export interface CreateFeatureInput {
  name: string;
  source: FeatureSource;
  description?: string;
  level?: number; // 1–20
  subtype?: string;
}

// --- Attach-a-catalog-row-to-a-character joins -----------------------------
// characterId is injected by the sheet section, like the owned-child inputs.

// POST /inventory-items.
export interface InventoryItemInput {
  itemId: string;
  quantity?: number;
  equipped?: boolean;
  attuned?: boolean;
}

// GET /inventory-items?locationId= — a building's stock (mirrors the `select`
// in inventory-items.queries.ts). Unlike character/creature-owned inventory,
// this is the one place a computed price is ever shown: `pricing` is null
// only for a priceless item (ItemCatalog.baseValueCp === null); when the
// economy is off, buyValueCp is just the unmodified base value.
export interface BuildingInventoryItem {
  id: string;
  itemId: string;
  locationId: string;
  quantity: number;
  equipped: boolean;
  attuned: boolean;
  item: ItemCatalog;
  pricing: { buyValueCp: number; sellValueCp: number } | null;
}

// POST /character-spells.
export interface CharacterSpellJoinInput {
  spellId: string;
  known?: boolean;
  prepared?: boolean;
  alwaysPrepared?: boolean;
  sourceClass?: string | null;
}

// POST /character-feats (pure join).
export interface CharacterFeatJoinInput {
  featId: string;
}

// POST /character-features.
export interface CharacterFeatureJoinInput {
  featureId: string;
  notes?: string | null;
}

// The wizard payload sent to the BFF (POST /api/characters). The server injects
// `playerId` (the current player) — the client never sets it. The wizard now
// only collects the main PlayerCharacter row; classes/skills and the other
// satellite-table data are added afterwards from the character sheet, so both
// arrays are optional here.
export interface CreateCharacterInput {
  characterName: string;
  race: string;
  subrace?: string | null;
  alignment?: Alignment | null;
  size?: CreatureSize;
  background?: string | null;
  campaignId?: string | null;

  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  strengthSaveProf?: boolean;
  dexteritySaveProf?: boolean;
  constitutionSaveProf?: boolean;
  intelligenceSaveProf?: boolean;
  wisdomSaveProf?: boolean;
  charismaSaveProf?: boolean;

  maxHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints?: number;
  // Manual AC fallback/override — armorClass itself is always computed
  // server-side from equipped armor/shield + Dex (see DerivedStats). null/
  // omitted = the standard 10 + Dex formula when unarmored.
  baseArmorClass?: number | null;
  speed?: number;
  flySpeed?: number | null;
  swimSpeed?: number | null;
  climbSpeed?: number | null;
  darkvision?: number | null;

  copper?: number;
  silver?: number;
  electrum?: number;
  gold?: number;
  platinum?: number;

  description?: string | null;
  traits?: string | null;
  ideals?: string | null;
  bonds?: string | null;
  flaws?: string | null;

  classes?: CharacterClassInput[];
  skills?: CharacterSkillInput[];
}

// Service-layer computed block (mirrors characters.derived.ts:DerivedStats).
export interface DerivedStats {
  totalLevel: number;
  proficiencyBonus: number;
  initiative: number;
  abilityModifiers: Record<Ability, number>;
  savingThrows: Record<Ability, number>;
  skills: Record<Skill, number>;
  armorClass: number;
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
  spellcasting: Array<{
    className: string;
    ability: Ability;
    saveDc: number;
    attackBonus: number;
  }>;
}

// The full virtual character sheet (GET /characters/:id/sheet). Mirrors
// characterSheetSelect in characters.queries.ts, plus the derived block.
export interface CharacterSheet {
  id: string;
  characterName: string;
  race: string;
  subrace: string | null;
  alignment: Alignment | null;
  size: CreatureSize;
  experiencePoints: number;
  inspiration: boolean;

  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  strengthSaveProf: boolean;
  dexteritySaveProf: boolean;
  constitutionSaveProf: boolean;
  intelligenceSaveProf: boolean;
  wisdomSaveProf: boolean;
  charismaSaveProf: boolean;

  maxHitPoints: number;
  currentHitPoints: number;
  temporaryHitPoints: number;
  hitPointMaxModifier: number;
  // Manual AC fallback/override — the computed value lives at derived.armorClass.
  baseArmorClass: number | null;
  deathSaveSuccesses: number;
  deathSaveFailures: number;

  speed: number;
  flySpeed: number | null;
  swimSpeed: number | null;
  climbSpeed: number | null;
  darkvision: number | null;
  concentratingOnSpellId: string | null;

  copper: number;
  silver: number;
  electrum: number;
  gold: number;
  platinum: number;

  description: string | null;
  background: string | null;
  traits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;

  playerId: string | null;
  campaignId: string | null;
  createdAt: string;
  updatedAt: string;

  classes: Array<{
    id: string;
    className: string;
    subclass: string | null;
    level: number;
    hitDieSize: number;
    hitDiceUsed: number;
    spellcastingAbility: Ability | null;
  }>;
  skills: Array<{ id: string; skill: Skill; proficiency: SkillProficiency }>;
  spellSlots: Array<{
    id: string;
    level: number;
    max: number;
    used: number;
    isPact: boolean;
  }>;
  resources: Array<{
    id: string;
    name: string;
    current: number;
    max: number;
    rechargeOn: RestType;
  }>;
  proficiencies: Array<{ id: string; type: string; name: string }>;
  conditions: Array<{
    id: string;
    name: string;
    level: number | null;
    notes: string | null;
  }>;
  // The joined catalog rows are the *full* catalog projections — the sheet
  // select reuses the /items, /spells, /feats and /features selects — so the UI
  // can show a row's whole description without a second request.
  spells: Array<{
    known: boolean;
    prepared: boolean;
    alwaysPrepared: boolean;
    sourceClass: string | null;
    spell: SpellCatalog;
  }>;
  feats: Array<{ feat: FeatCatalog }>;
  features: Array<{ notes: string | null; feature: FeatureCatalog }>;
  inventory: Array<{
    id: string;
    quantity: number;
    equipped: boolean;
    attuned: boolean;
    item: ItemCatalog;
  }>;
  derived: DerivedStats;
}

// --- Creatures (NPCs + monsters) -------------------------------------------

// NPCs and monsters share one table discriminated by `kind`, so these types
// cover both. Mirrors creatures.queries.ts.
export type CreatureType =
  | "ABERRATION"
  | "BEAST"
  | "CELESTIAL"
  | "CONSTRUCT"
  | "DRAGON"
  | "ELEMENTAL"
  | "FEY"
  | "FIEND"
  | "GIANT"
  | "HUMANOID"
  | "MONSTROSITY"
  | "OOZE"
  | "PLANT"
  | "UNDEAD";

export type StatBlockEntryCategory =
  | "TRAIT"
  | "ACTION"
  | "BONUS_ACTION"
  | "REACTION"
  | "LEGENDARY_ACTION"
  | "MYTHIC_ACTION"
  | "LAIR_ACTION"
  | "REGIONAL_EFFECT";

export type DamageModifierKind = "VULNERABILITY" | "RESISTANCE" | "IMMUNITY";

// The creature counterpart of DerivedStats — no totalLevel and no spellcasting
// block (a creature's proficiency bonus comes from its CR, not class levels),
// so it is deliberately a separate type.
export interface CreatureDerivedStats {
  proficiencyBonus: number;
  initiative: number;
  abilityModifiers: Record<Ability, number>;
  savingThrows: Record<Ability, number>;
  skills: Record<Skill, number>;
  armorClass: number;
  passivePerception: number;
  passiveInvestigation: number;
  passiveInsight: number;
}

// GET /creatures — creatureListSelect. campaignId tells a campaign-owned
// creature from a shared-catalog one (null).
export interface CreatureSummary {
  id: string;
  kind: CreatureKind;
  name: string;
  size: CreatureSize;
  creatureType: CreatureType | null;
  alignment: Alignment | null;
  armorClass: number;
  hitPoints: number;
  challengeRating: number | null;
  campaignId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Every stored Creature scalar (creatureScalarSelect). challengeRating is a
// Prisma Decimal in the DB but always a plain number over the wire.
export interface CreatureScalars {
  id: string;
  kind: CreatureKind;
  name: string;
  description: string | null;

  size: CreatureSize;
  creatureType: CreatureType | null;
  typeTags: string[];
  alignment: Alignment | null;
  alignmentNote: string | null;

  // Manual AC fallback/override — the computed value lives at derived.armorClass.
  baseArmorClass: number | null;
  armorClassNote: string | null;
  hitPoints: number;
  hitDice: string | null;

  speed: number;
  flySpeed: number | null;
  swimSpeed: number | null;
  climbSpeed: number | null;
  burrowSpeed: number | null;
  hover: boolean;

  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  strengthSaveProf: boolean;
  dexteritySaveProf: boolean;
  constitutionSaveProf: boolean;
  intelligenceSaveProf: boolean;
  wisdomSaveProf: boolean;
  charismaSaveProf: boolean;

  darkvision: number | null;
  blindsight: number | null;
  blindBeyond: boolean;
  tremorsense: number | null;
  truesight: number | null;

  languages: string | null;
  conditionImmunities: string[];

  challengeRating: number | null;
  experiencePoints: number | null;
  legendaryActionsPerRound: number | null;
  hasLair: boolean;

  environment: string[];
  source: string | null;
  occupation: string | null;
  faction: string | null;
  race: string | null;

  campaignId: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /creatures/:id (and the PATCH response) — scalars + skills + derived.
export interface CreatureCore extends CreatureScalars {
  skills: Array<{ id: string; skill: Skill; proficiency: SkillProficiency }>;
  derived: CreatureDerivedStats;
}

// GET /creatures/:id/sheet — the full stat block. Named StatBlock rather than
// Sheet so it never reads as the character sheet.
export interface CreatureStatBlock extends CreatureCore {
  entries: Array<{
    id: string;
    category: StatBlockEntryCategory;
    name: string;
    description: string;
    sortOrder: number;
    legendaryCost: number | null;
  }>;
  damageModifiers: Array<{
    id: string;
    kind: DamageModifierKind;
    damageType: DamageType | null;
    note: string | null;
  }>;
  // The full catalog projection, like the character sheet's — the stat block
  // renders an item's whole detail popover without a second request.
  inventory: Array<{
    id: string;
    quantity: number;
    equipped: boolean;
    attuned: boolean;
    item: ItemCatalog;
  }>;
  placements: Array<{
    quantity: number;
    notes: string | null;
    location: LocationSummary;
  }>;
}

// POST /creatures. Everything the API does not require carries a default.
export interface CreateCreatureInput {
  kind: CreatureKind;
  name: string;
  hitPoints: number;

  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  description?: string | null;
  size?: CreatureSize;
  creatureType?: CreatureType | null;
  typeTags?: string[];
  alignment?: Alignment | null;
  alignmentNote?: string | null;
  // Manual AC fallback/override — armorClass itself is always computed
  // server-side from equipped armor/shield + Dex (see CreatureDerivedStats).
  // null/omitted = the standard 10 + Dex formula when unarmored.
  baseArmorClass?: number | null;
  armorClassNote?: string | null;
  hitDice?: string | null;

  speed?: number;
  flySpeed?: number | null;
  swimSpeed?: number | null;
  climbSpeed?: number | null;
  burrowSpeed?: number | null;
  hover?: boolean;

  strengthSaveProf?: boolean;
  dexteritySaveProf?: boolean;
  constitutionSaveProf?: boolean;
  intelligenceSaveProf?: boolean;
  wisdomSaveProf?: boolean;
  charismaSaveProf?: boolean;

  darkvision?: number | null;
  blindsight?: number | null;
  blindBeyond?: boolean;
  tremorsense?: number | null;
  truesight?: number | null;

  languages?: string | null;
  conditionImmunities?: string[];

  challengeRating?: number | null;
  experiencePoints?: number | null;
  legendaryActionsPerRound?: number | null;
  hasLair?: boolean;

  environment?: string[];
  source?: string | null;
  occupation?: string | null;
  faction?: string | null;
  race?: string | null;

  campaignId?: string | null;
}

// PATCH /creatures/:id — every field is optional, including the ones create
// requires. campaignId moves the creature between a campaign and the catalog.
export type UpdateCreatureInput = Partial<CreateCreatureInput>;

// --- Creature children -----------------------------------------------------
// The standalone child endpoints echo creatureId back; the stat-block read
// omits it (the parent is implied).

export interface CreatureSkillRow {
  id: string;
  creatureId: string;
  skill: Skill;
  proficiency: SkillProficiency;
}

export interface CreatureSkillInput {
  creatureId: string;
  skill: Skill;
  proficiency?: SkillProficiency;
}

export interface StatBlockEntryRow {
  id: string;
  creatureId: string;
  category: StatBlockEntryCategory;
  name: string;
  description: string;
  sortOrder: number;
  legendaryCost: number | null;
}

export interface StatBlockEntryInput {
  creatureId: string;
  category: StatBlockEntryCategory;
  name: string;
  description: string;
  sortOrder?: number;
  legendaryCost?: number | null;
}

export interface CreatureDamageModifierRow {
  id: string;
  creatureId: string;
  kind: DamageModifierKind;
  damageType: DamageType | null;
  note: string | null;
}

export interface CreatureDamageModifierInput {
  creatureId: string;
  kind: DamageModifierKind;
  damageType?: DamageType | null;
  note?: string | null;
}

// CreaturePlacement is keyed on (creatureId, locationId) — it has no id.
export interface CreaturePlacementRow {
  creatureId: string;
  locationId: string;
  quantity: number;
  notes: string | null;
  creature: { id: string; name: string; kind: CreatureKind };
  location: LocationSummary;
}

export interface CreaturePlacementInput {
  creatureId: string;
  locationId: string;
  quantity?: number;
  notes?: string | null;
}

// The key pair is immutable — only these two travel on PATCH.
export interface UpdateCreaturePlacementInput {
  quantity?: number;
  notes?: string | null;
}

// The API's generic error body: { "error": "…" }.
export interface ApiError {
  error: string;
}

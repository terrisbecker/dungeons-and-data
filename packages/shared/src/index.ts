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
  createdAt: string;
  updatedAt: string;
}

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
  armorClass: number;
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
  armorClass: number;
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

// The API's generic error body: { "error": "…" }.
export interface ApiError {
  error: string;
}

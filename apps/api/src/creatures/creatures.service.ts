import {
  Alignment,
  CreatureKind,
  CreatureSize,
  CreatureType,
  Prisma,
} from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import { flattenItem } from "../items/items.service.js";
import {
  asRecord,
  nullableInt,
  optionalBoolean,
  optionalEnum,
  optionalFloat,
  optionalInt,
  optionalString,
  optionalStringArray,
  optionalUuidField,
  requireEnum,
  requireInt,
  requireString,
} from "../http/validate.js";
import {
  type AbilityScores,
  abilityModifier,
  computeArmorClass,
  computeDerived,
  type DerivedInput,
  type DerivedStats,
  type EquippedArmorPiece,
  type SaveProficiencies,
} from "./creatures.derived.js";
import {
  createCreature,
  type CreatureListFilter,
  deleteCreature,
  findCreatureCore,
  findCreatureSheet,
  findCreatures,
  updateCreature,
} from "./creatures.queries.js";

const KINDS = Object.values(CreatureKind);
const SIZES = Object.values(CreatureSize);
const CREATURE_TYPES = Object.values(CreatureType);
const ALIGNMENTS = Object.values(Alignment);

const ABILITY_MIN = 1;
const ABILITY_MAX = 30;

// Fields that can be set on both create and update. Returns only the keys the
// caller actually provided so PATCH stays partial.
function parseOptionalFields(
  body: Record<string, unknown>,
): Partial<Prisma.CreatureUncheckedCreateInput> {
  const data: Partial<Prisma.CreatureUncheckedCreateInput> = {};

  const set = <T>(key: string, value: T | undefined) => {
    if (value !== undefined) {
      (data as Record<string, unknown>)[key] = value;
    }
  };

  set("description", optionalString(body, "description"));

  // Header
  set("size", optionalEnum(body, "size", SIZES));
  set("creatureType", optionalEnum(body, "creatureType", CREATURE_TYPES));
  set("typeTags", optionalStringArray(body, "typeTags"));
  set("alignment", optionalEnum(body, "alignment", ALIGNMENTS));
  set("alignmentNote", optionalString(body, "alignmentNote"));

  // Defense
  set("baseArmorClass", nullableInt(body, "baseArmorClass", { min: 0 }));
  set("armorClassNote", optionalString(body, "armorClassNote"));
  set("hitDice", optionalString(body, "hitDice"));

  // Movement
  set("speed", optionalInt(body, "speed", { min: 0 }));
  set("flySpeed", optionalInt(body, "flySpeed", { min: 0 }));
  set("swimSpeed", optionalInt(body, "swimSpeed", { min: 0 }));
  set("climbSpeed", optionalInt(body, "climbSpeed", { min: 0 }));
  set("burrowSpeed", optionalInt(body, "burrowSpeed", { min: 0 }));
  set("hover", optionalBoolean(body, "hover"));

  // Saving-throw proficiencies
  set("strengthSaveProf", optionalBoolean(body, "strengthSaveProf"));
  set("dexteritySaveProf", optionalBoolean(body, "dexteritySaveProf"));
  set("constitutionSaveProf", optionalBoolean(body, "constitutionSaveProf"));
  set("intelligenceSaveProf", optionalBoolean(body, "intelligenceSaveProf"));
  set("wisdomSaveProf", optionalBoolean(body, "wisdomSaveProf"));
  set("charismaSaveProf", optionalBoolean(body, "charismaSaveProf"));

  // Senses
  set("darkvision", optionalInt(body, "darkvision", { min: 0 }));
  set("blindsight", optionalInt(body, "blindsight", { min: 0 }));
  set("blindBeyond", optionalBoolean(body, "blindBeyond"));
  set("tremorsense", optionalInt(body, "tremorsense", { min: 0 }));
  set("truesight", optionalInt(body, "truesight", { min: 0 }));

  set("languages", optionalString(body, "languages"));
  set("conditionImmunities", optionalStringArray(body, "conditionImmunities"));

  // Challenge
  set("challengeRating", optionalFloat(body, "challengeRating", { min: 0 }));
  set("experiencePoints", optionalInt(body, "experiencePoints", { min: 0 }));
  set(
    "legendaryActionsPerRound",
    optionalInt(body, "legendaryActionsPerRound", { min: 0 }),
  );
  set("hasLair", optionalBoolean(body, "hasLair"));

  // Flavor (monster-only / NPC-only)
  set("environment", optionalStringArray(body, "environment"));
  set("source", optionalString(body, "source"));
  set("occupation", optionalString(body, "occupation"));
  set("faction", optionalString(body, "faction"));
  set("race", optionalString(body, "race"));

  // Owning campaign (null = shared catalog creature). Drives authorization.
  set("campaignId", optionalUuidField(body, "campaignId"));

  return data;
}

function ability(body: Record<string, unknown>, key: string): number {
  return requireInt(body, key, { min: ABILITY_MIN, max: ABILITY_MAX });
}

export async function createCreatureService(rawBody: unknown) {
  const body = asRecord(rawBody);

  const data: Prisma.CreatureUncheckedCreateInput = {
    kind: requireEnum(body, "kind", KINDS),
    name: requireString(body, "name"),
    hitPoints: requireInt(body, "hitPoints", { min: 0 }),
    strength: ability(body, "strength"),
    dexterity: ability(body, "dexterity"),
    constitution: ability(body, "constitution"),
    intelligence: ability(body, "intelligence"),
    wisdom: ability(body, "wisdom"),
    charisma: ability(body, "charisma"),
    ...parseOptionalFields(body),
  };

  try {
    return normalizeCreature(await createCreature(data));
  } catch (error) {
    mapPrismaError(error);
  }
}

// Pulls the equipped armor/shield pieces out of an inventory relation —
// whichever shape it was joined in (the lean core/list armor-only join, or
// the full sheet join, both carry `equipped` + `item.armor`).
function extractEquippedArmor(
  inventory: {
    equipped: boolean;
    item: { armor: EquippedArmorPiece | null };
  }[],
): EquippedArmorPiece[] {
  return inventory
    .filter((row) => row.equipped && row.item.armor !== null)
    .map((row) => row.item.armor as EquippedArmorPiece);
}

export async function listCreaturesService(filter?: CreatureListFilter) {
  const rows = await findCreatures(filter);
  return rows.map(({ inventory, dexterity, baseArmorClass, ...row }) => {
    const normalized = normalizeCreature(row);
    return {
      ...normalized,
      armorClass: computeArmorClass(
        abilityModifier(dexterity),
        baseArmorClass,
        extractEquippedArmor(inventory),
      ),
    };
  });
}

// Core read: creature + skills + the computed derived block.
export async function getCreatureService(id: string) {
  const creature = await findCreatureCore(id);
  if (!creature) {
    throw notFound();
  }
  const { inventory: _inventory, ...rest } = withDerived(creature);
  return rest;
}

// Full stat block: every related table joined in, plus derived.
export async function getCreatureSheetService(id: string) {
  const creature = await findCreatureSheet(id);
  if (!creature) {
    throw notFound();
  }
  // Compute derived stats (armorClass needs the raw, unflattened inventory —
  // item.armor nested) before flattening the item rows for the response. The
  // joined item rows carry the 1:1 weapon/armor satellites; fold them in so
  // `inventory[].item` is the same flat shape GET /items returns.
  const derived = withDerived(creature);
  return {
    ...derived,
    inventory: derived.inventory.map((row) => ({
      ...row,
      item: flattenItem(row.item),
    })),
  };
}

export async function updateCreatureService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);

  const data = parseOptionalFields(body);

  // Ability scores are optional on update but still bounded when present.
  for (const key of [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
  ] as const) {
    const value = optionalInt(body, key, {
      min: ABILITY_MIN,
      max: ABILITY_MAX,
    });
    if (value !== undefined) {
      data[key] = value;
    }
  }
  const kind = optionalEnum(body, "kind", KINDS);
  if (kind !== undefined) data.kind = kind;
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  const hitPoints = optionalInt(body, "hitPoints", { min: 0 });
  if (hitPoints !== undefined) data.hitPoints = hitPoints;

  try {
    await updateCreature(id, data);
  } catch (error) {
    mapPrismaError(error);
  }

  return getCreatureService(id);
}

export async function deleteCreatureService(id: string): Promise<void> {
  try {
    await deleteCreature(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

// The challengeRating column is a Prisma Decimal; expose it as a plain number
// (null = unrated) so responses and the derived math both see a JS number.
function normalizeCreature<
  T extends { challengeRating: Prisma.Decimal | null },
>(
  creature: T,
): Omit<T, "challengeRating"> & { challengeRating: number | null } {
  return {
    ...creature,
    challengeRating:
      creature.challengeRating === null
        ? null
        : creature.challengeRating.toNumber(),
  };
}

// Generic over the core and sheet shapes — both carry the ability scores, save
// proficiencies, CR, and skills that computeDerived reads, plus an
// `inventory` relation (the lean armor-only join on core, the full catalog
// join on the sheet) that armorClass is computed from.
type CreatureDerivedSource = AbilityScores &
  SaveProficiencies & {
    challengeRating: Prisma.Decimal | null;
    skills: DerivedInput["skills"];
    baseArmorClass: number | null;
    inventory: {
      equipped: boolean;
      item: { armor: EquippedArmorPiece | null };
    }[];
  };

function withDerived<T extends CreatureDerivedSource>(creature: T) {
  const normalized = normalizeCreature(creature);
  const derived: DerivedStats = computeDerived({
    ...normalized,
    equippedArmor: extractEquippedArmor(normalized.inventory),
  });
  return { ...normalized, derived };
}

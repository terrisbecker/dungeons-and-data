import { Alignment, CreatureSize, Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  nullableInt,
  nullableString,
  optionalBoolean,
  optionalEnum,
  optionalInt,
  optionalString,
  requireInt,
  requireString,
} from "../http/validate.js";
import { flattenItem } from "../items/items.service.js";
import {
  abilityModifier,
  computeArmorClass,
  computeDerived,
  totalLevel,
  type DerivedInput,
  type DerivedStats,
  type EquippedArmorPiece,
} from "./characters.derived.js";
import {
  createCharacter,
  findCharacterCore,
  findCharacterSheet,
  findCharacters,
  softDeleteCharacter,
  updateCharacter,
} from "./characters.queries.js";

const ALIGNMENTS = Object.values(Alignment);
const SIZES = Object.values(CreatureSize);

const ABILITY_MIN = 1;
const ABILITY_MAX = 30;

// Fields that can be set on both create and update. Returns only the keys the
// caller actually provided so PATCH stays partial. Nullable columns the sheet
// can empty (the extra speeds, darkvision, subrace, the roleplay boxes) go
// through the nullable* parsers so an explicit `null` clears them; the rest use
// optional*, where `null` is indistinguishable from an absent key.
function parseOptionalFields(
  body: Record<string, unknown>,
): Partial<Prisma.PlayerCharacterUncheckedCreateInput> {
  const data: Partial<Prisma.PlayerCharacterUncheckedCreateInput> = {};

  const set = <T>(key: string, value: T | undefined) => {
    if (value !== undefined) {
      (data as Record<string, unknown>)[key] = value;
    }
  };

  set("subrace", nullableString(body, "subrace"));
  set("baseArmorClass", nullableInt(body, "baseArmorClass", { min: 0 }));
  set("alignment", optionalEnum(body, "alignment", ALIGNMENTS));
  set("size", optionalEnum(body, "size", SIZES));
  set("experiencePoints", optionalInt(body, "experiencePoints", { min: 0 }));
  set("inspiration", optionalBoolean(body, "inspiration"));

  set("strengthSaveProf", optionalBoolean(body, "strengthSaveProf"));
  set("dexteritySaveProf", optionalBoolean(body, "dexteritySaveProf"));
  set("constitutionSaveProf", optionalBoolean(body, "constitutionSaveProf"));
  set("intelligenceSaveProf", optionalBoolean(body, "intelligenceSaveProf"));
  set("wisdomSaveProf", optionalBoolean(body, "wisdomSaveProf"));
  set("charismaSaveProf", optionalBoolean(body, "charismaSaveProf"));

  set(
    "temporaryHitPoints",
    optionalInt(body, "temporaryHitPoints", { min: 0 }),
  );
  set("hitPointMaxModifier", optionalInt(body, "hitPointMaxModifier"));
  set(
    "deathSaveSuccesses",
    optionalInt(body, "deathSaveSuccesses", { min: 0, max: 3 }),
  );
  set(
    "deathSaveFailures",
    optionalInt(body, "deathSaveFailures", { min: 0, max: 3 }),
  );

  set("speed", optionalInt(body, "speed", { min: 0 }));
  set("flySpeed", nullableInt(body, "flySpeed", { min: 0 }));
  set("swimSpeed", nullableInt(body, "swimSpeed", { min: 0 }));
  set("climbSpeed", nullableInt(body, "climbSpeed", { min: 0 }));
  set("darkvision", nullableInt(body, "darkvision", { min: 0 }));
  set("concentratingOnSpellId", optionalString(body, "concentratingOnSpellId"));

  set("copper", optionalInt(body, "copper", { min: 0 }));
  set("silver", optionalInt(body, "silver", { min: 0 }));
  set("electrum", optionalInt(body, "electrum", { min: 0 }));
  set("gold", optionalInt(body, "gold", { min: 0 }));
  set("platinum", optionalInt(body, "platinum", { min: 0 }));

  set("description", nullableString(body, "description"));
  set("background", nullableString(body, "background"));
  set("traits", nullableString(body, "traits"));
  set("ideals", nullableString(body, "ideals"));
  set("bonds", nullableString(body, "bonds"));
  set("flaws", nullableString(body, "flaws"));
  set("playerId", optionalString(body, "playerId"));
  set("campaignId", optionalString(body, "campaignId"));

  return data;
}

function ability(body: Record<string, unknown>, key: string): number {
  return requireInt(body, key, { min: ABILITY_MIN, max: ABILITY_MAX });
}

export async function createCharacterService(rawBody: unknown) {
  const body = asRecord(rawBody);

  const maxHitPoints = requireInt(body, "maxHitPoints", { min: 0 });
  const temporaryHitPoints =
    optionalInt(body, "temporaryHitPoints", { min: 0 }) ?? 0;
  const currentHitPoints = requireInt(body, "currentHitPoints", {
    min: 0,
    max: maxHitPoints + temporaryHitPoints,
  });

  const data: Prisma.PlayerCharacterUncheckedCreateInput = {
    characterName: requireString(body, "characterName"),
    race: requireString(body, "race"),
    strength: ability(body, "strength"),
    dexterity: ability(body, "dexterity"),
    constitution: ability(body, "constitution"),
    intelligence: ability(body, "intelligence"),
    wisdom: ability(body, "wisdom"),
    charisma: ability(body, "charisma"),
    maxHitPoints,
    currentHitPoints,
    ...parseOptionalFields(body),
  };

  try {
    return await createCharacter(data);
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

export async function listCharactersService(
  playerId?: string,
  campaignId?: string,
) {
  const characters = await findCharacters(playerId, campaignId);
  return characters.map(
    ({ classes, inventory, dexterity, baseArmorClass, ...character }) => ({
      ...character,
      totalLevel: totalLevel(classes),
      armorClass: computeArmorClass(
        abilityModifier(dexterity),
        baseArmorClass,
        extractEquippedArmor(inventory),
      ),
    }),
  );
}

// Core read: character + classes/skills + the computed derived block.
export async function getCharacterService(id: string) {
  const character = await findCharacterCore(id);
  if (!character) {
    throw notFound();
  }
  const { inventory: _inventory, ...rest } = withDerived(character);
  return rest;
}

// Full "virtual character sheet": every related table joined in, plus derived.
export async function getCharacterSheetService(id: string) {
  const character = await findCharacterSheet(id);
  if (!character) {
    throw notFound();
  }
  // Compute derived stats (armorClass needs the raw, unflattened inventory —
  // item.armor nested) before flattening the item rows for the response. The
  // joined item rows carry the 1:1 weapon/armor satellites; fold them in so
  // `inventory[].item` is the same flat shape GET /items returns.
  const derived = withDerived(character);
  return {
    ...derived,
    inventory: derived.inventory.map((row) => ({
      ...row,
      item: flattenItem(row.item),
    })),
  };
}

export async function updateCharacterService(id: string, rawBody: unknown) {
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
  const maxHitPoints = optionalInt(body, "maxHitPoints", { min: 0 });
  if (maxHitPoints !== undefined) {
    data.maxHitPoints = maxHitPoints;
  }
  const currentHitPoints = optionalInt(body, "currentHitPoints", { min: 0 });
  if (currentHitPoints !== undefined) {
    data.currentHitPoints = currentHitPoints;
  }

  try {
    const result = await updateCharacter(id, data);
    if (result.count === 0) {
      throw notFound();
    }
  } catch (error) {
    mapPrismaError(error);
  }

  return getCharacterService(id);
}

export async function deleteCharacterService(id: string): Promise<void> {
  const result = await softDeleteCharacter(id);
  if (result.count === 0) {
    throw notFound();
  }
}

// Generic over the core and sheet shapes — both carry the scalars/classes/
// skills DerivedInput needs, plus an `inventory` relation (the lean armor-only
// join on core, the full catalog join on the sheet) that armorClass is
// computed from instead of a plain `equippedArmor` field.
type CharacterDerivedSource = Omit<DerivedInput, "equippedArmor"> & {
  inventory: {
    equipped: boolean;
    item: { armor: EquippedArmorPiece | null };
  }[];
};

function withDerived<T extends CharacterDerivedSource>(
  character: T,
): T & { derived: DerivedStats } {
  const derived = computeDerived({
    ...character,
    equippedArmor: extractEquippedArmor(character.inventory),
  });
  return { ...character, derived };
}

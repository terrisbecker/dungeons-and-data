import {
  ArmorCategory,
  DamageType,
  ItemRarity,
  ItemType,
  Prisma,
  WeaponCategory,
  WeaponProperty,
} from "@prisma/client";
import { badRequest, notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalBoolean,
  optionalEnum,
  optionalEnumArray,
  optionalFloat,
  optionalInt,
  optionalString,
  optionalStringArray,
  requireString,
} from "../http/validate.js";
import {
  createItem,
  deleteItem,
  findItemById,
  findItems,
  updateItem,
} from "./items.queries.js";

const ITEM_TYPES = Object.values(ItemType);
const RARITIES = Object.values(ItemRarity);
const WEAPON_CATEGORIES = Object.values(WeaponCategory);
const WEAPON_PROPERTIES = Object.values(WeaponProperty);
const ARMOR_CATEGORIES = Object.values(ArmorCategory);
const DAMAGE_TYPES = Object.values(DamageType);

// Only keys the caller actually supplied are copied, so PATCH stays partial.
function assign<T extends object>(target: T, key: keyof T, value: unknown) {
  if (value !== undefined) {
    (target as Record<string, unknown>)[key as string] = value;
  }
}

// Base (shared) columns that live directly on Item.
function parseBaseFields(
  body: Record<string, unknown>,
): Partial<Prisma.ItemCreateInput> {
  const data: Partial<Prisma.ItemCreateInput> = {};
  assign(data, "description", optionalString(body, "description"));
  assign(data, "type", optionalEnum(body, "type", ITEM_TYPES));
  assign(data, "rarity", optionalEnum(body, "rarity", RARITIES));
  assign(data, "isMagic", optionalBoolean(body, "isMagic"));
  assign(data, "tags", optionalStringArray(body, "tags"));
  assign(
    data,
    "requiresAttunement",
    optionalBoolean(body, "requiresAttunement"),
  );
  assign(data, "weight", optionalFloat(body, "weight", { min: 0 }));
  assign(data, "stackable", optionalBoolean(body, "stackable"));
  assign(data, "consumable", optionalBoolean(body, "consumable"));
  assign(data, "baseValueCp", optionalInt(body, "baseValueCp", { min: 0 }));
  return data;
}

// Weapon satellite fields — only the keys the caller supplied.
function parseWeaponFields(body: Record<string, unknown>) {
  const data: Partial<Prisma.WeaponStatsCreateWithoutItemInput> = {};
  assign(
    data,
    "weaponCategory",
    optionalEnum(body, "weaponCategory", WEAPON_CATEGORIES),
  );
  assign(data, "damageDice", optionalString(body, "damageDice"));
  assign(data, "damageType", optionalEnum(body, "damageType", DAMAGE_TYPES));
  assign(data, "versatileDamage", optionalString(body, "versatileDamage"));
  assign(
    data,
    "weaponProperties",
    optionalEnumArray(body, "weaponProperties", WEAPON_PROPERTIES),
  );
  assign(data, "rangeNormal", optionalInt(body, "rangeNormal", { min: 0 }));
  assign(data, "rangeLong", optionalInt(body, "rangeLong", { min: 0 }));
  return data;
}

// Armor satellite fields — only the keys the caller supplied.
function parseArmorFields(body: Record<string, unknown>) {
  const data: Partial<Prisma.ArmorStatsCreateWithoutItemInput> = {};
  assign(
    data,
    "armorCategory",
    optionalEnum(body, "armorCategory", ARMOR_CATEGORIES),
  );
  assign(data, "baseArmorClass", optionalInt(body, "baseArmorClass"));
  assign(
    data,
    "addDexToArmorClass",
    optionalBoolean(body, "addDexToArmorClass"),
  );
  assign(data, "maxDexBonus", optionalInt(body, "maxDexBonus"));
  assign(data, "strengthRequirement", optionalInt(body, "strengthRequirement"));
  assign(
    data,
    "stealthDisadvantage",
    optionalBoolean(body, "stealthDisadvantage"),
  );
  return data;
}

// Fold the 1:1 satellites back into a single flat object so the API response
// shape is unchanged. Swap this for `return row;` to expose nested
// weapon/armor objects instead.
function flattenItem<T extends { weapon: object | null; armor: object | null }>(
  row: T,
) {
  const { weapon, armor, ...base } = row;
  return { ...base, ...weapon, ...armor };
}

export async function createItemService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const base = parseBaseFields(body);
  const type = (base.type as ItemType | undefined) ?? ItemType.ADVENTURING_GEAR;
  const weapon = parseWeaponFields(body);
  const armor = parseArmorFields(body);

  // Invariant: the stat block must match the item's type. Weapon/armor stats on
  // any other type (or a WEAPON missing its required stats) is a bad request.
  const data: Prisma.ItemCreateInput = {
    name: requireString(body, "name"),
    ...base,
  };
  if (type === ItemType.WEAPON) {
    if (Object.keys(armor).length > 0) {
      throw badRequest("armor stats are not allowed on a WEAPON");
    }
    if (
      weapon.weaponCategory === undefined ||
      weapon.damageDice === undefined ||
      weapon.damageType === undefined
    ) {
      throw badRequest(
        "a WEAPON requires weaponCategory, damageDice, and damageType",
      );
    }
    data.weapon = {
      create: weapon as Prisma.WeaponStatsCreateWithoutItemInput,
    };
  } else if (type === ItemType.ARMOR) {
    if (Object.keys(weapon).length > 0) {
      throw badRequest("weapon stats are not allowed on ARMOR");
    }
    if (
      armor.armorCategory === undefined ||
      armor.baseArmorClass === undefined
    ) {
      throw badRequest("ARMOR requires armorCategory and baseArmorClass");
    }
    data.armor = { create: armor as Prisma.ArmorStatsCreateWithoutItemInput };
  } else if (Object.keys(weapon).length > 0 || Object.keys(armor).length > 0) {
    throw badRequest(`weapon/armor stats are not allowed on type ${type}`);
  }

  try {
    return flattenItem(await createItem(data));
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function listItemsService() {
  return (await findItems()).map(flattenItem);
}

export async function getItemService(id: string) {
  const row = await findItemById(id);
  if (!row) throw notFound();
  return flattenItem(row);
}

export async function updateItemService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.ItemUpdateInput = parseBaseFields(body);
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;

  // Partial stat patches update the existing satellite row. Patching stats onto
  // an item that doesn't have that block yet (i.e. a type change) is out of
  // scope for this draft — Prisma raises P2025 (→ 404) if the row is absent.
  const weapon = parseWeaponFields(body);
  const armor = parseArmorFields(body);
  if (Object.keys(weapon).length > 0) {
    data.weapon = { update: weapon };
  }
  if (Object.keys(armor).length > 0) {
    data.armor = { update: armor };
  }

  try {
    return flattenItem(await updateItem(id, data));
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteItemService(id: string): Promise<void> {
  try {
    await deleteItem(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

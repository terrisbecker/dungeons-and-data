import {
  ArmorCategory,
  DamageType,
  ItemRarity,
  ItemType,
  Prisma,
  WeaponCategory,
  WeaponProperty,
} from "@prisma/client";
import { notFound } from "../http/http-error.js";
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

// Fields shared by create and update. Only keys the caller supplied are set so
// PATCH stays partial.
function parseOptionalFields(
  body: Record<string, unknown>,
): Partial<Prisma.ItemUncheckedCreateInput> {
  const data: Partial<Prisma.ItemUncheckedCreateInput> = {};
  const set = <T>(key: string, value: T | undefined) => {
    if (value !== undefined) {
      (data as Record<string, unknown>)[key] = value;
    }
  };

  set("description", optionalString(body, "description"));
  set("type", optionalEnum(body, "type", ITEM_TYPES));
  set("rarity", optionalEnum(body, "rarity", RARITIES));
  set("isMagic", optionalBoolean(body, "isMagic"));
  set("tags", optionalStringArray(body, "tags"));
  set("requiresAttunement", optionalBoolean(body, "requiresAttunement"));
  set("weight", optionalFloat(body, "weight", { min: 0 }));
  set("stackable", optionalBoolean(body, "stackable"));
  set("consumable", optionalBoolean(body, "consumable"));
  set("baseValueCp", optionalInt(body, "baseValueCp", { min: 0 }));

  // Weapon stats
  set(
    "weaponCategory",
    optionalEnum(body, "weaponCategory", WEAPON_CATEGORIES),
  );
  set("damageDice", optionalString(body, "damageDice"));
  set("damageType", optionalEnum(body, "damageType", DAMAGE_TYPES));
  set("versatileDamage", optionalString(body, "versatileDamage"));
  set(
    "weaponProperties",
    optionalEnumArray(body, "weaponProperties", WEAPON_PROPERTIES),
  );
  set("rangeNormal", optionalInt(body, "rangeNormal", { min: 0 }));
  set("rangeLong", optionalInt(body, "rangeLong", { min: 0 }));

  // Armor stats
  set("armorCategory", optionalEnum(body, "armorCategory", ARMOR_CATEGORIES));
  set("baseArmorClass", optionalInt(body, "baseArmorClass"));
  set("addDexToArmorClass", optionalBoolean(body, "addDexToArmorClass"));
  set("maxDexBonus", optionalInt(body, "maxDexBonus"));
  set("strengthRequirement", optionalInt(body, "strengthRequirement"));
  set("stealthDisadvantage", optionalBoolean(body, "stealthDisadvantage"));

  return data;
}

export async function createItemService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.ItemUncheckedCreateInput = {
    name: requireString(body, "name"),
    ...parseOptionalFields(body),
  };
  try {
    return await createItem(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listItemsService() {
  return findItems();
}

export async function getItemService(id: string) {
  const row = await findItemById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateItemService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.ItemUncheckedUpdateInput = parseOptionalFields(body);
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  try {
    return await updateItem(id, data);
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

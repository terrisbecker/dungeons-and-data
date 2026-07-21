import { Prisma } from "@prisma/client";
import { conflict, notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalBoolean,
  optionalInt,
  requireUuidField,
} from "../http/validate.js";
import {
  countAttunedForCharacter,
  createInventoryItem,
  deleteInventoryItem,
  findInventoryItemById,
  findInventoryItems,
  updateInventoryItem,
} from "./inventory-items.queries.js";

const ATTUNEMENT_CAP = 3;

async function assertAttunementCapacity(
  characterId: string,
  excludeId?: string,
) {
  const attunedCount = await countAttunedForCharacter(characterId, excludeId);
  if (attunedCount >= ATTUNEMENT_CAP) {
    throw conflict();
  }
}

export async function createInventoryItemService(rawBody: unknown) {
  const body = asRecord(rawBody);
  // Owner is forced to the character here; npcId is left null so the DB's
  // exactly-one-owner CHECK is satisfied.
  const characterId = requireUuidField(body, "characterId");
  const data: Prisma.InventoryItemUncheckedCreateInput = {
    itemId: requireUuidField(body, "itemId"),
    characterId,
  };
  const quantity = optionalInt(body, "quantity", { min: 1 });
  if (quantity !== undefined) data.quantity = quantity;
  const equipped = optionalBoolean(body, "equipped");
  if (equipped !== undefined) data.equipped = equipped;
  const attuned = optionalBoolean(body, "attuned");
  if (attuned !== undefined) data.attuned = attuned;

  if (attuned === true) {
    await assertAttunementCapacity(characterId);
  }

  try {
    return await createInventoryItem(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listInventoryItemsService(characterId: string) {
  return findInventoryItems(characterId);
}

export async function getInventoryItemService(id: string) {
  const row = await findInventoryItemById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateInventoryItemService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const existing = await findInventoryItemById(id);
  if (!existing) throw notFound();

  const data: Prisma.InventoryItemUncheckedUpdateInput = {};
  const quantity = optionalInt(body, "quantity", { min: 1 });
  if (quantity !== undefined) data.quantity = quantity;
  const equipped = optionalBoolean(body, "equipped");
  if (equipped !== undefined) data.equipped = equipped;
  const attuned = optionalBoolean(body, "attuned");
  if (attuned !== undefined) data.attuned = attuned;

  // Only newly attuning an item can breach the cap.
  if (attuned === true && !existing.attuned && existing.characterId) {
    await assertAttunementCapacity(existing.characterId, id);
  }

  try {
    return await updateInventoryItem(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteInventoryItemService(id: string): Promise<void> {
  try {
    await deleteInventoryItem(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

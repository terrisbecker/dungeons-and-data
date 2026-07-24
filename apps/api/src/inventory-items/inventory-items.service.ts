import { Prisma } from "@prisma/client";
import { badRequest, conflict, notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalBoolean,
  optionalInt,
  optionalUuidField,
  requireUuidField,
} from "../http/validate.js";
import {
  countAttunedForCharacter,
  countAttunedForCreature,
  createInventoryItem,
  deleteInventoryItem,
  findInventoryItemById,
  findInventoryItems,
  updateInventoryItem,
} from "./inventory-items.queries.js";

const ATTUNEMENT_CAP = 3;

// The owner of an inventory item is polymorphic: exactly one of characterId /
// creatureId is set (the DB enforces this with a CHECK constraint).
type Owner = { characterId: string } | { creatureId: string };

async function assertAttunementCapacity(owner: Owner, excludeId?: string) {
  const attunedCount =
    "characterId" in owner
      ? await countAttunedForCharacter(owner.characterId, excludeId)
      : await countAttunedForCreature(owner.creatureId, excludeId);
  if (attunedCount >= ATTUNEMENT_CAP) {
    throw conflict();
  }
}

export async function createInventoryItemService(rawBody: unknown) {
  const body = asRecord(rawBody);

  // Exactly one owner must be provided — mirrors the DB's characterId XOR
  // creatureId CHECK so a bad request fails with a 400 rather than a 500.
  const characterId = optionalUuidField(body, "characterId");
  const creatureId = optionalUuidField(body, "creatureId");
  if ((characterId === undefined) === (creatureId === undefined)) {
    throw badRequest();
  }
  const owner: Owner =
    characterId !== undefined
      ? { characterId }
      : { creatureId: creatureId as string };

  const data: Prisma.InventoryItemUncheckedCreateInput = {
    itemId: requireUuidField(body, "itemId"),
    ...owner,
  };
  const quantity = optionalInt(body, "quantity", { min: 1 });
  if (quantity !== undefined) data.quantity = quantity;
  const equipped = optionalBoolean(body, "equipped");
  if (equipped !== undefined) data.equipped = equipped;
  const attuned = optionalBoolean(body, "attuned");
  if (attuned !== undefined) data.attuned = attuned;

  if (attuned === true) {
    await assertAttunementCapacity(owner);
  }

  try {
    return await createInventoryItem(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listInventoryItemsService(filter: {
  characterId?: string;
  creatureId?: string;
}) {
  const where: Prisma.InventoryItemWhereInput = {};
  if (filter.characterId !== undefined) where.characterId = filter.characterId;
  if (filter.creatureId !== undefined) where.creatureId = filter.creatureId;
  return findInventoryItems(where);
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

  // Only newly attuning an item can breach the cap; check against its owner.
  if (attuned === true && !existing.attuned) {
    if (existing.characterId) {
      await assertAttunementCapacity({ characterId: existing.characterId }, id);
    } else if (existing.creatureId) {
      await assertAttunementCapacity({ creatureId: existing.creatureId }, id);
    }
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

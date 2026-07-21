import { Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalBoolean,
  optionalInt,
  requireInt,
  requireUuidField,
} from "../http/validate.js";
import {
  createSpellSlot,
  deleteSpellSlot,
  findSpellSlotById,
  findSpellSlots,
  updateSpellSlot,
} from "./spell-slots.queries.js";

export async function createSpellSlotService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.SpellSlotUncheckedCreateInput = {
    characterId: requireUuidField(body, "characterId"),
    level: requireInt(body, "level", { min: 1, max: 9 }),
    max: requireInt(body, "max", { min: 0 }),
  };
  const used = optionalInt(body, "used", { min: 0 });
  if (used !== undefined) data.used = used;
  const isPact = optionalBoolean(body, "isPact");
  if (isPact !== undefined) data.isPact = isPact;
  try {
    return await createSpellSlot(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listSpellSlotsService(characterId: string) {
  return findSpellSlots(characterId);
}

export async function getSpellSlotService(id: string) {
  const row = await findSpellSlotById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateSpellSlotService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.SpellSlotUncheckedUpdateInput = {};
  const level = optionalInt(body, "level", { min: 1, max: 9 });
  if (level !== undefined) data.level = level;
  const max = optionalInt(body, "max", { min: 0 });
  if (max !== undefined) data.max = max;
  const used = optionalInt(body, "used", { min: 0 });
  if (used !== undefined) data.used = used;
  const isPact = optionalBoolean(body, "isPact");
  if (isPact !== undefined) data.isPact = isPact;
  try {
    return await updateSpellSlot(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteSpellSlotService(id: string): Promise<void> {
  try {
    await deleteSpellSlot(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

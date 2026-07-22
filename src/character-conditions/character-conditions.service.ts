import { Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalInt,
  optionalString,
  requireString,
  requireUuidField,
} from "../http/validate.js";
import {
  createCharacterCondition,
  deleteCharacterCondition,
  findCharacterConditionById,
  findCharacterConditions,
  updateCharacterCondition,
} from "./character-conditions.queries.js";

export async function createCharacterConditionService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterConditionUncheckedCreateInput = {
    characterId: requireUuidField(body, "characterId"),
    name: requireString(body, "name"),
  };
  const level = optionalInt(body, "level", { min: 1 });
  if (level !== undefined) data.level = level;
  const notes = optionalString(body, "notes");
  if (notes !== undefined) data.notes = notes;
  try {
    return await createCharacterCondition(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listCharacterConditionsService(characterId: string) {
  return findCharacterConditions(characterId);
}

export async function getCharacterConditionService(id: string) {
  const row = await findCharacterConditionById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateCharacterConditionService(
  id: string,
  rawBody: unknown,
) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterConditionUncheckedUpdateInput = {};
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  const level = optionalInt(body, "level", { min: 1 });
  if (level !== undefined) data.level = level;
  const notes = optionalString(body, "notes");
  if (notes !== undefined) data.notes = notes;
  try {
    return await updateCharacterCondition(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteCharacterConditionService(
  id: string,
): Promise<void> {
  try {
    await deleteCharacterCondition(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

import { Prisma, RestType } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalEnum,
  optionalInt,
  optionalString,
  requireInt,
  requireString,
  requireUuidField,
} from "../http/validate.js";
import {
  createCharacterResource,
  deleteCharacterResource,
  findCharacterResourceById,
  findCharacterResources,
  updateCharacterResource,
} from "./character-resources.queries.js";

const REST_TYPES = Object.values(RestType);

export async function createCharacterResourceService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterResourceUncheckedCreateInput = {
    characterId: requireUuidField(body, "characterId"),
    name: requireString(body, "name"),
    current: requireInt(body, "current", { min: 0 }),
    max: requireInt(body, "max", { min: 0 }),
  };
  const rechargeOn = optionalEnum(body, "rechargeOn", REST_TYPES);
  if (rechargeOn !== undefined) data.rechargeOn = rechargeOn;
  try {
    return await createCharacterResource(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listCharacterResourcesService(characterId: string) {
  return findCharacterResources(characterId);
}

export async function getCharacterResourceService(id: string) {
  const row = await findCharacterResourceById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateCharacterResourceService(
  id: string,
  rawBody: unknown,
) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterResourceUncheckedUpdateInput = {};
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  const current = optionalInt(body, "current", { min: 0 });
  if (current !== undefined) data.current = current;
  const max = optionalInt(body, "max", { min: 0 });
  if (max !== undefined) data.max = max;
  const rechargeOn = optionalEnum(body, "rechargeOn", REST_TYPES);
  if (rechargeOn !== undefined) data.rechargeOn = rechargeOn;
  try {
    return await updateCharacterResource(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteCharacterResourceService(
  id: string,
): Promise<void> {
  try {
    await deleteCharacterResource(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

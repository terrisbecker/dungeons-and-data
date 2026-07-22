import { Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalString,
  requireString,
  requireUuidField,
} from "../http/validate.js";
import {
  createProficiency,
  deleteProficiency,
  findProficiencies,
  findProficiencyById,
  updateProficiency,
} from "./proficiencies.queries.js";

export async function createProficiencyService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.ProficiencyUncheckedCreateInput = {
    characterId: requireUuidField(body, "characterId"),
    type: requireString(body, "type"),
    name: requireString(body, "name"),
  };
  try {
    return await createProficiency(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listProficienciesService(characterId: string) {
  return findProficiencies(characterId);
}

export async function getProficiencyService(id: string) {
  const row = await findProficiencyById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateProficiencyService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.ProficiencyUncheckedUpdateInput = {};
  const type = optionalString(body, "type");
  if (type !== undefined) data.type = type;
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  try {
    return await updateProficiency(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteProficiencyService(id: string): Promise<void> {
  try {
    await deleteProficiency(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

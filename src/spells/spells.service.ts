import { Prisma, SpellSchool } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalEnum,
  optionalInt,
  optionalString,
  requireInt,
  requireString,
} from "../http/validate.js";
import {
  createSpell,
  deleteSpell,
  findSpellById,
  findSpells,
  updateSpell,
} from "./spells.queries.js";

const SCHOOLS = Object.values(SpellSchool);

export async function createSpellService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.SpellUncheckedCreateInput = {
    name: requireString(body, "name"),
    level: requireInt(body, "level", { min: 0, max: 9 }),
  };
  const school = optionalEnum(body, "school", SCHOOLS);
  if (school !== undefined) data.school = school;
  const description = optionalString(body, "description");
  if (description !== undefined) data.description = description;
  try {
    return await createSpell(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listSpellsService() {
  return findSpells();
}

export async function getSpellService(id: string) {
  const row = await findSpellById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateSpellService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.SpellUncheckedUpdateInput = {};
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  const level = optionalInt(body, "level", { min: 0, max: 9 });
  if (level !== undefined) data.level = level;
  const school = optionalEnum(body, "school", SCHOOLS);
  if (school !== undefined) data.school = school;
  const description = optionalString(body, "description");
  if (description !== undefined) data.description = description;
  try {
    return await updateSpell(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteSpellService(id: string): Promise<void> {
  try {
    await deleteSpell(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

import { Ability, Prisma } from "@prisma/client";
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
  createCharacterClass,
  deleteCharacterClass,
  findCharacterClassById,
  findCharacterClasses,
  updateCharacterClass,
} from "./character-classes.queries.js";

const ABILITIES = Object.values(Ability);

function parseOptionalFields(
  body: Record<string, unknown>,
): Partial<Prisma.CharacterClassUncheckedCreateInput> {
  const data: Partial<Prisma.CharacterClassUncheckedCreateInput> = {};
  const subclass = optionalString(body, "subclass");
  if (subclass !== undefined) data.subclass = subclass;
  const level = optionalInt(body, "level", { min: 1 });
  if (level !== undefined) data.level = level;
  const hitDiceUsed = optionalInt(body, "hitDiceUsed", { min: 0 });
  if (hitDiceUsed !== undefined) data.hitDiceUsed = hitDiceUsed;
  const spellcastingAbility = optionalEnum(
    body,
    "spellcastingAbility",
    ABILITIES,
  );
  if (spellcastingAbility !== undefined) {
    data.spellcastingAbility = spellcastingAbility;
  }
  return data;
}

export async function createCharacterClassService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterClassUncheckedCreateInput = {
    characterId: requireUuidField(body, "characterId"),
    className: requireString(body, "className"),
    hitDieSize: requireInt(body, "hitDieSize", { min: 1 }),
    ...parseOptionalFields(body),
  };
  try {
    return await createCharacterClass(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listCharacterClassesService(characterId: string) {
  return findCharacterClasses(characterId);
}

export async function getCharacterClassService(id: string) {
  const row = await findCharacterClassById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateCharacterClassService(
  id: string,
  rawBody: unknown,
) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterClassUncheckedUpdateInput =
    parseOptionalFields(body);
  const className = optionalString(body, "className");
  if (className !== undefined) data.className = className;
  const hitDieSize = optionalInt(body, "hitDieSize", { min: 1 });
  if (hitDieSize !== undefined) data.hitDieSize = hitDieSize;
  try {
    return await updateCharacterClass(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteCharacterClassService(id: string): Promise<void> {
  try {
    await deleteCharacterClass(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

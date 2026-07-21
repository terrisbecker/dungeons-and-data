import { Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalBoolean,
  optionalString,
  requireUuidField,
} from "../http/validate.js";
import {
  createCharacterSpell,
  deleteCharacterSpell,
  findCharacterSpell,
  findCharacterSpells,
  updateCharacterSpell,
} from "./character-spells.queries.js";

export async function createCharacterSpellService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterSpellUncheckedCreateInput = {
    characterId: requireUuidField(body, "characterId"),
    spellId: requireUuidField(body, "spellId"),
  };
  const known = optionalBoolean(body, "known");
  if (known !== undefined) data.known = known;
  const prepared = optionalBoolean(body, "prepared");
  if (prepared !== undefined) data.prepared = prepared;
  const sourceClass = optionalString(body, "sourceClass");
  if (sourceClass !== undefined) data.sourceClass = sourceClass;
  try {
    return await createCharacterSpell(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listCharacterSpellsService(characterId: string) {
  return findCharacterSpells(characterId);
}

export async function getCharacterSpellService(
  characterId: string,
  spellId: string,
) {
  const row = await findCharacterSpell(characterId, spellId);
  if (!row) throw notFound();
  return row;
}

export async function updateCharacterSpellService(
  characterId: string,
  spellId: string,
  rawBody: unknown,
) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterSpellUncheckedUpdateInput = {};
  const known = optionalBoolean(body, "known");
  if (known !== undefined) data.known = known;
  const prepared = optionalBoolean(body, "prepared");
  if (prepared !== undefined) data.prepared = prepared;
  const sourceClass = optionalString(body, "sourceClass");
  if (sourceClass !== undefined) data.sourceClass = sourceClass;
  try {
    return await updateCharacterSpell(characterId, spellId, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteCharacterSpellService(
  characterId: string,
  spellId: string,
): Promise<void> {
  try {
    await deleteCharacterSpell(characterId, spellId);
  } catch (error) {
    mapPrismaError(error);
  }
}

import { Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import { asRecord, requireUuidField } from "../http/validate.js";
import {
  createCharacterFeat,
  deleteCharacterFeat,
  findCharacterFeat,
  findCharacterFeats,
} from "./character-feats.queries.js";

// CharacterFeat is a pure join row (its only columns are the two keys), so there
// is nothing to PATCH — the surface is add / list / get / remove.

export async function createCharacterFeatService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterFeatUncheckedCreateInput = {
    characterId: requireUuidField(body, "characterId"),
    featId: requireUuidField(body, "featId"),
  };
  try {
    return await createCharacterFeat(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listCharacterFeatsService(characterId: string) {
  return findCharacterFeats(characterId);
}

export async function getCharacterFeatService(
  characterId: string,
  featId: string,
) {
  const row = await findCharacterFeat(characterId, featId);
  if (!row) throw notFound();
  return row;
}

export async function deleteCharacterFeatService(
  characterId: string,
  featId: string,
): Promise<void> {
  try {
    await deleteCharacterFeat(characterId, featId);
  } catch (error) {
    mapPrismaError(error);
  }
}

import { Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalString,
  requireUuidField,
} from "../http/validate.js";
import {
  createCharacterFeature,
  deleteCharacterFeature,
  findCharacterFeature,
  findCharacterFeatures,
  updateCharacterFeature,
} from "./character-features.queries.js";

export async function createCharacterFeatureService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterFeatureUncheckedCreateInput = {
    characterId: requireUuidField(body, "characterId"),
    featureId: requireUuidField(body, "featureId"),
  };
  const notes = optionalString(body, "notes");
  if (notes !== undefined) data.notes = notes;
  try {
    return await createCharacterFeature(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listCharacterFeaturesService(characterId: string) {
  return findCharacterFeatures(characterId);
}

export async function getCharacterFeatureService(
  characterId: string,
  featureId: string,
) {
  const row = await findCharacterFeature(characterId, featureId);
  if (!row) throw notFound();
  return row;
}

export async function updateCharacterFeatureService(
  characterId: string,
  featureId: string,
  rawBody: unknown,
) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterFeatureUncheckedUpdateInput = {};
  const notes = optionalString(body, "notes");
  if (notes !== undefined) data.notes = notes;
  try {
    return await updateCharacterFeature(characterId, featureId, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteCharacterFeatureService(
  characterId: string,
  featureId: string,
): Promise<void> {
  try {
    await deleteCharacterFeature(characterId, featureId);
  } catch (error) {
    mapPrismaError(error);
  }
}

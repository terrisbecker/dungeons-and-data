import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  characterId: true,
  featureId: true,
  notes: true,
  feature: { select: { id: true, name: true, source: true } },
} satisfies Prisma.CharacterFeatureSelect;

export function createCharacterFeature(
  data: Prisma.CharacterFeatureUncheckedCreateInput,
) {
  return prisma.characterFeature.create({ data, select });
}

export function findCharacterFeatures(characterId: string) {
  return prisma.characterFeature.findMany({ where: { characterId }, select });
}

export function findCharacterFeature(characterId: string, featureId: string) {
  return prisma.characterFeature.findUnique({
    where: { characterId_featureId: { characterId, featureId } },
    select,
  });
}

export function updateCharacterFeature(
  characterId: string,
  featureId: string,
  data: Prisma.CharacterFeatureUncheckedUpdateInput,
) {
  return prisma.characterFeature.update({
    where: { characterId_featureId: { characterId, featureId } },
    data,
    select,
  });
}

export function deleteCharacterFeature(characterId: string, featureId: string) {
  return prisma.characterFeature.delete({
    where: { characterId_featureId: { characterId, featureId } },
  });
}

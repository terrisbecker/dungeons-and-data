import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  characterId: true,
  featId: true,
  feat: { select: { id: true, name: true } },
} satisfies Prisma.CharacterFeatSelect;

export function createCharacterFeat(
  data: Prisma.CharacterFeatUncheckedCreateInput,
) {
  return prisma.characterFeat.create({ data, select });
}

export function findCharacterFeats(characterId: string) {
  return prisma.characterFeat.findMany({ where: { characterId }, select });
}

export function findCharacterFeat(characterId: string, featId: string) {
  return prisma.characterFeat.findUnique({
    where: { characterId_featId: { characterId, featId } },
    select,
  });
}

export function deleteCharacterFeat(characterId: string, featId: string) {
  return prisma.characterFeat.delete({
    where: { characterId_featId: { characterId, featId } },
  });
}

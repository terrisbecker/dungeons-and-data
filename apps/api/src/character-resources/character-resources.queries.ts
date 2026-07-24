import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  characterId: true,
  name: true,
  current: true,
  max: true,
  rechargeOn: true,
} satisfies Prisma.CharacterResourceSelect;

export function createCharacterResource(
  data: Prisma.CharacterResourceUncheckedCreateInput,
) {
  return prisma.characterResource.create({ data, select });
}

export function findCharacterResources(characterId: string) {
  return prisma.characterResource.findMany({
    where: { characterId },
    orderBy: { name: "asc" },
    select,
  });
}

export function findCharacterResourceById(id: string) {
  return prisma.characterResource.findUnique({ where: { id }, select });
}

export function updateCharacterResource(
  id: string,
  data: Prisma.CharacterResourceUncheckedUpdateInput,
) {
  return prisma.characterResource.update({ where: { id }, data, select });
}

export function deleteCharacterResource(id: string) {
  return prisma.characterResource.delete({ where: { id } });
}

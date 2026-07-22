import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  characterId: true,
  name: true,
  level: true,
  notes: true,
} satisfies Prisma.CharacterConditionSelect;

export function createCharacterCondition(
  data: Prisma.CharacterConditionUncheckedCreateInput,
) {
  return prisma.characterCondition.create({ data, select });
}

export function findCharacterConditions(characterId: string) {
  return prisma.characterCondition.findMany({
    where: { characterId },
    orderBy: { name: "asc" },
    select,
  });
}

export function findCharacterConditionById(id: string) {
  return prisma.characterCondition.findUnique({ where: { id }, select });
}

export function updateCharacterCondition(
  id: string,
  data: Prisma.CharacterConditionUncheckedUpdateInput,
) {
  return prisma.characterCondition.update({ where: { id }, data, select });
}

export function deleteCharacterCondition(id: string) {
  return prisma.characterCondition.delete({ where: { id } });
}

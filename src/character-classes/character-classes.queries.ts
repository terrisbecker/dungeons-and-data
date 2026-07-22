import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  characterId: true,
  className: true,
  subclass: true,
  level: true,
  hitDieSize: true,
  hitDiceUsed: true,
  spellcastingAbility: true,
} satisfies Prisma.CharacterClassSelect;

export function createCharacterClass(
  data: Prisma.CharacterClassUncheckedCreateInput,
) {
  return prisma.characterClass.create({ data, select });
}

export function findCharacterClasses(characterId: string) {
  return prisma.characterClass.findMany({
    where: { characterId },
    orderBy: { className: "asc" },
    select,
  });
}

export function findCharacterClassById(id: string) {
  return prisma.characterClass.findUnique({ where: { id }, select });
}

export function updateCharacterClass(
  id: string,
  data: Prisma.CharacterClassUncheckedUpdateInput,
) {
  return prisma.characterClass.update({ where: { id }, data, select });
}

export function deleteCharacterClass(id: string) {
  return prisma.characterClass.delete({ where: { id } });
}

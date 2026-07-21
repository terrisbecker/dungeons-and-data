import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  characterId: true,
  skill: true,
  proficiency: true,
} satisfies Prisma.CharacterSkillSelect;

export function createCharacterSkill(
  data: Prisma.CharacterSkillUncheckedCreateInput,
) {
  return prisma.characterSkill.create({ data, select });
}

export function findCharacterSkills(characterId: string) {
  return prisma.characterSkill.findMany({
    where: { characterId },
    orderBy: { skill: "asc" },
    select,
  });
}

export function findCharacterSkillById(id: string) {
  return prisma.characterSkill.findUnique({ where: { id }, select });
}

export function updateCharacterSkill(
  id: string,
  data: Prisma.CharacterSkillUncheckedUpdateInput,
) {
  return prisma.characterSkill.update({ where: { id }, data, select });
}

export function deleteCharacterSkill(id: string) {
  return prisma.characterSkill.delete({ where: { id } });
}

import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  creatureId: true,
  skill: true,
  proficiency: true,
} satisfies Prisma.CreatureSkillSelect;

export function createCreatureSkill(
  data: Prisma.CreatureSkillUncheckedCreateInput,
) {
  return prisma.creatureSkill.create({ data, select });
}

export function findCreatureSkills(creatureId: string) {
  return prisma.creatureSkill.findMany({
    where: { creatureId },
    orderBy: { skill: "asc" },
    select,
  });
}

export function findCreatureSkillById(id: string) {
  return prisma.creatureSkill.findUnique({ where: { id }, select });
}

export function updateCreatureSkill(
  id: string,
  data: Prisma.CreatureSkillUncheckedUpdateInput,
) {
  return prisma.creatureSkill.update({ where: { id }, data, select });
}

export function deleteCreatureSkill(id: string) {
  return prisma.creatureSkill.delete({ where: { id } });
}

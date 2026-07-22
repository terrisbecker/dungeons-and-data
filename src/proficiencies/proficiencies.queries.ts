import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  characterId: true,
  type: true,
  name: true,
} satisfies Prisma.ProficiencySelect;

export function createProficiency(
  data: Prisma.ProficiencyUncheckedCreateInput,
) {
  return prisma.proficiency.create({ data, select });
}

export function findProficiencies(characterId: string) {
  return prisma.proficiency.findMany({
    where: { characterId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select,
  });
}

export function findProficiencyById(id: string) {
  return prisma.proficiency.findUnique({ where: { id }, select });
}

export function updateProficiency(
  id: string,
  data: Prisma.ProficiencyUncheckedUpdateInput,
) {
  return prisma.proficiency.update({ where: { id }, data, select });
}

export function deleteProficiency(id: string) {
  return prisma.proficiency.delete({ where: { id } });
}

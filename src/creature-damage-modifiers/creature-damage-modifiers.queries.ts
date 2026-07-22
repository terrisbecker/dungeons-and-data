import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  creatureId: true,
  kind: true,
  damageType: true,
  note: true,
} satisfies Prisma.CreatureDamageModifierSelect;

export function createCreatureDamageModifier(
  data: Prisma.CreatureDamageModifierUncheckedCreateInput,
) {
  return prisma.creatureDamageModifier.create({ data, select });
}

export function findCreatureDamageModifiers(creatureId: string) {
  return prisma.creatureDamageModifier.findMany({
    where: { creatureId },
    orderBy: [{ kind: "asc" }, { damageType: "asc" }],
    select,
  });
}

export function findCreatureDamageModifierById(id: string) {
  return prisma.creatureDamageModifier.findUnique({ where: { id }, select });
}

export function updateCreatureDamageModifier(
  id: string,
  data: Prisma.CreatureDamageModifierUncheckedUpdateInput,
) {
  return prisma.creatureDamageModifier.update({ where: { id }, data, select });
}

export function deleteCreatureDamageModifier(id: string) {
  return prisma.creatureDamageModifier.delete({ where: { id } });
}

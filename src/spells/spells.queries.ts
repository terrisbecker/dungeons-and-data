import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  name: true,
  level: true,
  school: true,
  description: true,
  castingTime: true,
  range: true,
  duration: true,
  higherLevel: true,
  verbal: true,
  somatic: true,
  material: true,
  materialComponent: true,
  concentration: true,
  ritual: true,
  savingThrow: true,
  damageType: true,
  isAttack: true,
} satisfies Prisma.SpellSelect;

export function createSpell(data: Prisma.SpellUncheckedCreateInput) {
  return prisma.spell.create({ data, select });
}

export function findSpells() {
  return prisma.spell.findMany({
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select,
  });
}

export function findSpellById(id: string) {
  return prisma.spell.findUnique({ where: { id }, select });
}

export function updateSpell(
  id: string,
  data: Prisma.SpellUncheckedUpdateInput,
) {
  return prisma.spell.update({ where: { id }, data, select });
}

export function deleteSpell(id: string) {
  return prisma.spell.delete({ where: { id } });
}

import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  characterId: true,
  level: true,
  max: true,
  used: true,
  isPact: true,
} satisfies Prisma.SpellSlotSelect;

export function createSpellSlot(data: Prisma.SpellSlotUncheckedCreateInput) {
  return prisma.spellSlot.create({ data, select });
}

export function findSpellSlots(characterId: string) {
  return prisma.spellSlot.findMany({
    where: { characterId },
    orderBy: [{ isPact: "asc" }, { level: "asc" }],
    select,
  });
}

export function findSpellSlotById(id: string) {
  return prisma.spellSlot.findUnique({ where: { id }, select });
}

export function updateSpellSlot(
  id: string,
  data: Prisma.SpellSlotUncheckedUpdateInput,
) {
  return prisma.spellSlot.update({ where: { id }, data, select });
}

export function deleteSpellSlot(id: string) {
  return prisma.spellSlot.delete({ where: { id } });
}

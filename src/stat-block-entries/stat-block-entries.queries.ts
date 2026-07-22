import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  creatureId: true,
  category: true,
  name: true,
  description: true,
  sortOrder: true,
  legendaryCost: true,
} satisfies Prisma.StatBlockEntrySelect;

export function createStatBlockEntry(
  data: Prisma.StatBlockEntryUncheckedCreateInput,
) {
  return prisma.statBlockEntry.create({ data, select });
}

export function findStatBlockEntries(creatureId: string) {
  return prisma.statBlockEntry.findMany({
    where: { creatureId },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    select,
  });
}

export function findStatBlockEntryById(id: string) {
  return prisma.statBlockEntry.findUnique({ where: { id }, select });
}

export function updateStatBlockEntry(
  id: string,
  data: Prisma.StatBlockEntryUncheckedUpdateInput,
) {
  return prisma.statBlockEntry.update({ where: { id }, data, select });
}

export function deleteStatBlockEntry(id: string) {
  return prisma.statBlockEntry.delete({ where: { id } });
}

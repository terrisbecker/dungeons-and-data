import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  name: true,
  description: true,
} satisfies Prisma.FeatSelect;

export function createFeat(data: Prisma.FeatUncheckedCreateInput) {
  return prisma.feat.create({ data, select });
}

export function findFeats() {
  return prisma.feat.findMany({ orderBy: { name: "asc" }, select });
}

export function findFeatById(id: string) {
  return prisma.feat.findUnique({ where: { id }, select });
}

export function updateFeat(id: string, data: Prisma.FeatUncheckedUpdateInput) {
  return prisma.feat.update({ where: { id }, data, select });
}

export function deleteFeat(id: string) {
  return prisma.feat.delete({ where: { id } });
}

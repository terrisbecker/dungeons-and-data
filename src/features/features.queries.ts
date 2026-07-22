import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  name: true,
  description: true,
  source: true,
  level: true,
  subtype: true,
} satisfies Prisma.FeatureSelect;

export function createFeature(data: Prisma.FeatureUncheckedCreateInput) {
  return prisma.feature.create({ data, select });
}

export function findFeatures() {
  return prisma.feature.findMany({
    orderBy: [{ source: "asc" }, { name: "asc" }],
    select,
  });
}

export function findFeatureById(id: string) {
  return prisma.feature.findUnique({ where: { id }, select });
}

export function updateFeature(
  id: string,
  data: Prisma.FeatureUncheckedUpdateInput,
) {
  return prisma.feature.update({ where: { id }, data, select });
}

export function deleteFeature(id: string) {
  return prisma.feature.delete({ where: { id } });
}

import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  creatureId: true,
  locationId: true,
  quantity: true,
  notes: true,
  creature: { select: { id: true, name: true, kind: true } },
  location: { select: { id: true, locationName: true, type: true } },
} satisfies Prisma.CreaturePlacementSelect;

export function createCreaturePlacement(
  data: Prisma.CreaturePlacementUncheckedCreateInput,
) {
  return prisma.creaturePlacement.create({ data, select });
}

export function findCreaturePlacements(
  where: Prisma.CreaturePlacementWhereInput,
) {
  return prisma.creaturePlacement.findMany({ where, select });
}

export function findCreaturePlacement(creatureId: string, locationId: string) {
  return prisma.creaturePlacement.findUnique({
    where: { creatureId_locationId: { creatureId, locationId } },
    select,
  });
}

export function updateCreaturePlacement(
  creatureId: string,
  locationId: string,
  data: Prisma.CreaturePlacementUncheckedUpdateInput,
) {
  return prisma.creaturePlacement.update({
    where: { creatureId_locationId: { creatureId, locationId } },
    data,
    select,
  });
}

export function deleteCreaturePlacement(
  creatureId: string,
  locationId: string,
) {
  return prisma.creaturePlacement.delete({
    where: { creatureId_locationId: { creatureId, locationId } },
  });
}

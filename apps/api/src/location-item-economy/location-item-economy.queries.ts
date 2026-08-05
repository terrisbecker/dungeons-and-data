import { ItemType, Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  locationId: true,
  itemType: true,
  supplyLevel: true,
  demandLevel: true,
} satisfies Prisma.LocationItemTypeEconomySelect;

export function findLocationItemTypeEconomies(locationId: string) {
  return prisma.locationItemTypeEconomy.findMany({
    where: { locationId },
    orderBy: { itemType: "asc" },
    select,
  });
}

// No row exists until a DM first adjusts that type's sliders, so writes
// upsert rather than update.
export function upsertLocationItemTypeEconomy(
  locationId: string,
  itemType: ItemType,
  data: { supplyLevel?: number; demandLevel?: number },
) {
  return prisma.locationItemTypeEconomy.upsert({
    where: { locationId_itemType: { locationId, itemType } },
    create: { locationId, itemType, ...data },
    update: data,
    select,
  });
}

export function deleteLocationItemTypeEconomy(
  locationId: string,
  itemType: ItemType,
) {
  return prisma.locationItemTypeEconomy.delete({
    where: { locationId_itemType: { locationId, itemType } },
  });
}

// Batched lookup for the pricing chain walk: given a set of ancestor location
// ids (only the ones in "per item type" mode) and one item type, fetch
// whichever of them have an override row.
export function findLocationItemTypeEconomyForChain(
  locationIds: string[],
  itemType: ItemType,
) {
  return prisma.locationItemTypeEconomy.findMany({
    where: { locationId: { in: locationIds }, itemType },
    select: { locationId: true, supplyLevel: true, demandLevel: true },
  });
}

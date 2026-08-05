import { ItemType, Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  itemType: true,
  demandSlope: true,
} satisfies Prisma.ItemTypeEconomyConfigSelect;

export function findItemEconomyConfigs() {
  return prisma.itemTypeEconomyConfig.findMany({
    orderBy: { itemType: "asc" },
    select,
  });
}

export function findItemEconomyConfig(itemType: ItemType) {
  return prisma.itemTypeEconomyConfig.findUnique({
    where: { itemType },
    select,
  });
}

// No row exists until an Admin/DM first sets a slope for that type, so writes
// upsert rather than update.
export function upsertItemEconomyConfig(
  itemType: ItemType,
  demandSlope: number,
) {
  return prisma.itemTypeEconomyConfig.upsert({
    where: { itemType },
    create: { itemType, demandSlope },
    update: { demandSlope },
    select,
  });
}

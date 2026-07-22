import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  itemId: true,
  characterId: true,
  creatureId: true,
  quantity: true,
  equipped: true,
  attuned: true,
  item: {
    select: {
      id: true,
      name: true,
      type: true,
      rarity: true,
      requiresAttunement: true,
    },
  },
} satisfies Prisma.InventoryItemSelect;

export function createInventoryItem(
  data: Prisma.InventoryItemUncheckedCreateInput,
) {
  return prisma.inventoryItem.create({ data, select });
}

export function findInventoryItems(characterId: string) {
  return prisma.inventoryItem.findMany({
    where: { characterId },
    orderBy: { id: "asc" },
    select,
  });
}

export function findInventoryItemById(id: string) {
  return prisma.inventoryItem.findUnique({ where: { id }, select });
}

export function updateInventoryItem(
  id: string,
  data: Prisma.InventoryItemUncheckedUpdateInput,
) {
  return prisma.inventoryItem.update({ where: { id }, data, select });
}

export function deleteInventoryItem(id: string) {
  return prisma.inventoryItem.delete({ where: { id } });
}

// How many items a character is currently attuned to — 5e caps this at 3.
export function countAttunedForCharacter(
  characterId: string,
  excludeId?: string,
) {
  return prisma.inventoryItem.count({
    where: {
      characterId,
      attuned: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

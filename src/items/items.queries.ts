import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  name: true,
  description: true,
  type: true,
  rarity: true,
  isMagic: true,
  tags: true,
  requiresAttunement: true,
  weight: true,
  stackable: true,
  consumable: true,
  baseValueCp: true,
  // Type-specific stats now live in 1:1 satellites; pull them in so the service
  // layer can flatten them back into the response shape.
  weapon: {
    select: {
      weaponCategory: true,
      damageDice: true,
      damageType: true,
      versatileDamage: true,
      weaponProperties: true,
      rangeNormal: true,
      rangeLong: true,
    },
  },
  armor: {
    select: {
      armorCategory: true,
      baseArmorClass: true,
      addDexToArmorClass: true,
      maxDexBonus: true,
      strengthRequirement: true,
      stealthDisadvantage: true,
    },
  },
} satisfies Prisma.ItemSelect;

export function createItem(data: Prisma.ItemCreateInput) {
  return prisma.item.create({ data, select });
}

export function findItems() {
  return prisma.item.findMany({ orderBy: { name: "asc" }, select });
}

export function findItemById(id: string) {
  return prisma.item.findUnique({ where: { id }, select });
}

export function updateItem(id: string, data: Prisma.ItemUpdateInput) {
  return prisma.item.update({ where: { id }, data, select });
}

export function deleteItem(id: string) {
  return prisma.item.delete({ where: { id } });
}

import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

// Summary projection reused for the parent and children relations.
const locationSummarySelect = {
  id: true,
  locationName: true,
  type: true,
} satisfies Prisma.LocationSelect;

// List/base projection: scalars plus lightweight parent/children summaries.
const locationSelect = {
  id: true,
  locationName: true,
  description: true,
  type: true,
  campaignId: true,
  parentId: true,
  supplyLevel: true,
  demandLevel: true,
  useItemTypeEconomy: true,
  parent: { select: locationSummarySelect },
  children: {
    orderBy: { locationName: "asc" },
    select: locationSummarySelect,
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LocationSelect;

// Detail projection: adds the creatures placed at this location.
const locationDetailSelect = {
  ...locationSelect,
  creaturePlacements: {
    select: {
      quantity: true,
      notes: true,
      creature: { select: { id: true, name: true, kind: true } },
    },
  },
} satisfies Prisma.LocationSelect;

export function createLocation(data: Prisma.LocationUncheckedCreateInput) {
  return prisma.location.create({ data, select: locationSelect });
}

export function findLocations(campaignId?: string) {
  return prisma.location.findMany({
    where: campaignId ? { campaignId } : undefined,
    orderBy: { locationName: "asc" },
    select: locationSelect,
  });
}

// Just the parent pointer — used to walk the hierarchy upward when checking for
// cycles before re-parenting.
export function findLocationParentId(id: string) {
  return prisma.location.findUnique({
    where: { id },
    select: { parentId: true },
  });
}

// One step of the economy-modifier walk (see inventory-items.derived.ts):
// this location's sliders plus its parent pointer, so the caller can sum
// deltas all the way to the root.
export function findLocationEconomyStep(id: string) {
  return prisma.location.findUnique({
    where: { id },
    select: {
      supplyLevel: true,
      demandLevel: true,
      useItemTypeEconomy: true,
      parentId: true,
    },
  });
}

// The pair the "per-item-type economy is building-only" invariant needs to
// resolve the effective type/flag on a PATCH that may only touch one of them.
export function findLocationTypeAndFlag(id: string) {
  return prisma.location.findUnique({
    where: { id },
    select: { type: true, useItemTypeEconomy: true },
  });
}

export function findLocationById(id: string) {
  return prisma.location.findUnique({
    where: { id },
    select: locationDetailSelect,
  });
}

export function updateLocation(
  id: string,
  data: Prisma.LocationUncheckedUpdateInput,
) {
  return prisma.location.update({
    where: { id },
    data,
    select: locationSelect,
  });
}

export function deleteLocation(id: string) {
  return prisma.location.delete({ where: { id } });
}

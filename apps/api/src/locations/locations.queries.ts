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

export function findLocations() {
  return prisma.location.findMany({
    orderBy: { locationName: "asc" },
    select: locationSelect,
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

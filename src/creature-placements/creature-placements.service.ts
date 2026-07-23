import { Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalInt,
  optionalString,
  requireUuidField,
} from "../http/validate.js";
import {
  createCreaturePlacement,
  deleteCreaturePlacement,
  findCreaturePlacement,
  findCreaturePlacements,
  updateCreaturePlacement,
} from "./creature-placements.queries.js";

function parseOptionalFields(
  body: Record<string, unknown>,
): Partial<Prisma.CreaturePlacementUncheckedCreateInput> {
  const data: Partial<Prisma.CreaturePlacementUncheckedCreateInput> = {};
  const quantity = optionalInt(body, "quantity", { min: 1 });
  if (quantity !== undefined) data.quantity = quantity;
  const notes = optionalString(body, "notes");
  if (notes !== undefined) data.notes = notes;
  return data;
}

export async function createCreaturePlacementService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CreaturePlacementUncheckedCreateInput = {
    creatureId: requireUuidField(body, "creatureId"),
    locationId: requireUuidField(body, "locationId"),
    ...parseOptionalFields(body),
  };
  try {
    return await createCreaturePlacement(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

// Listing is filtered by creature or location (at least one, validated in the
// controller). Both filters combine when supplied.
export function listCreaturePlacementsService(filter: {
  creatureId?: string;
  locationId?: string;
}) {
  const where: Prisma.CreaturePlacementWhereInput = {};
  if (filter.creatureId !== undefined) where.creatureId = filter.creatureId;
  if (filter.locationId !== undefined) where.locationId = filter.locationId;
  return findCreaturePlacements(where);
}

export async function getCreaturePlacementService(
  creatureId: string,
  locationId: string,
) {
  const row = await findCreaturePlacement(creatureId, locationId);
  if (!row) throw notFound();
  return row;
}

export async function updateCreaturePlacementService(
  creatureId: string,
  locationId: string,
  rawBody: unknown,
) {
  const body = asRecord(rawBody);
  const data: Prisma.CreaturePlacementUncheckedUpdateInput =
    parseOptionalFields(body);
  try {
    return await updateCreaturePlacement(creatureId, locationId, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteCreaturePlacementService(
  creatureId: string,
  locationId: string,
): Promise<void> {
  try {
    await deleteCreaturePlacement(creatureId, locationId);
  } catch (error) {
    mapPrismaError(error);
  }
}

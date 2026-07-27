import { Prisma } from "@prisma/client";
import { badRequest, notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  nullableString,
  nullableUuidField,
  optionalString,
  optionalUuidField,
  requireString,
} from "../http/validate.js";
import {
  createLocation,
  deleteLocation,
  findLocationById,
  findLocationParentId,
  findLocations,
  updateLocation,
} from "./locations.queries.js";

function parseOptionalFields(
  body: Record<string, unknown>,
): Partial<Prisma.LocationUncheckedCreateInput> {
  const data: Partial<Prisma.LocationUncheckedCreateInput> = {};
  // description/parentId are nullable: an explicit null clears them, so a
  // location can be promoted back to a root.
  const description = nullableString(body, "description");
  if (description !== undefined) data.description = description;
  const parentId = nullableUuidField(body, "parentId");
  if (parentId !== undefined) data.parentId = parentId;
  // Owning campaign (null = shared location). Drives authorization.
  const campaignId = optionalUuidField(body, "campaignId");
  if (campaignId !== undefined) data.campaignId = campaignId;
  return data;
}

// The hierarchy is a tree, but nothing in the schema stops a PATCH from making
// a loop (A -> B -> A), which would hang every consumer that walks it. Prisma
// can't express the constraint, so it lives here with the other invariants:
// walk up from the proposed parent and refuse if we come back around to `id`.
async function assertNoParentCycle(id: string, parentId: string) {
  if (parentId === id) throw badRequest();
  const visited = new Set<string>([id]);
  let cursor: string | null = parentId;
  while (cursor !== null) {
    if (visited.has(cursor)) throw badRequest();
    visited.add(cursor);
    const row = await findLocationParentId(cursor);
    if (!row) throw badRequest();
    cursor = row.parentId;
  }
}

export async function createLocationService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.LocationUncheckedCreateInput = {
    locationName: requireString(body, "locationName"),
    type: requireString(body, "type"),
    ...parseOptionalFields(body),
  };
  try {
    return await createLocation(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listLocationsService(campaignId?: string) {
  return findLocations(campaignId);
}

export async function getLocationService(id: string) {
  const row = await findLocationById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateLocationService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.LocationUncheckedUpdateInput = parseOptionalFields(body);
  const locationName = optionalString(body, "locationName");
  if (locationName !== undefined) data.locationName = locationName;
  const type = optionalString(body, "type");
  if (type !== undefined) data.type = type;
  if (typeof data.parentId === "string") {
    await assertNoParentCycle(id, data.parentId);
  }
  try {
    return await updateLocation(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteLocationService(id: string): Promise<void> {
  try {
    await deleteLocation(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

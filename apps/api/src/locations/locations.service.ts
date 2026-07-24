import { Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalString,
  optionalUuidField,
  requireString,
} from "../http/validate.js";
import {
  createLocation,
  deleteLocation,
  findLocationById,
  findLocations,
  updateLocation,
} from "./locations.queries.js";

function parseOptionalFields(
  body: Record<string, unknown>,
): Partial<Prisma.LocationUncheckedCreateInput> {
  const data: Partial<Prisma.LocationUncheckedCreateInput> = {};
  const description = optionalString(body, "description");
  if (description !== undefined) data.description = description;
  const parentId = optionalUuidField(body, "parentId");
  if (parentId !== undefined) data.parentId = parentId;
  // Owning campaign (null = shared location). Drives authorization.
  const campaignId = optionalUuidField(body, "campaignId");
  if (campaignId !== undefined) data.campaignId = campaignId;
  return data;
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

export function listLocationsService() {
  return findLocations();
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

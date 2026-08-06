import { Prisma } from "@prisma/client";
import { badRequest, notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  nullableString,
  nullableUuidField,
  optionalBoolean,
  optionalInt,
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
  findLocationTypeAndFlag,
  updateLocation,
} from "./locations.queries.js";

// A location whose (trimmed, lowercased) type equals "building" is the only
// kind that gets a building inventory (and, per this invariant, the only
// kind that may switch to per-item-type economy sliders). Mirrors
// isBuildingType() in apps/web/src/lib/location-labels.ts — kept as a
// separate copy since there's no shared runtime code between the apps.
function isBuildingType(type: string): boolean {
  return type.trim().toLowerCase() === "building";
}

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
  // Economy engine sliders — see inventory-items.derived.ts for how these
  // combine with an item type's demandSlope into a price modifier.
  const supplyLevel = optionalInt(body, "supplyLevel");
  if (supplyLevel !== undefined) data.supplyLevel = supplyLevel;
  const demandLevel = optionalInt(body, "demandLevel");
  if (demandLevel !== undefined) data.demandLevel = demandLevel;
  // Mode switch: false = the global sliders above apply to every item type;
  // true = each type is priced from its own LocationItemTypeEconomy row
  // instead (see inventory-items.service.ts's resolveEconomyChain).
  const useItemTypeEconomy = optionalBoolean(body, "useItemTypeEconomy");
  if (useItemTypeEconomy !== undefined) {
    data.useItemTypeEconomy = useItemTypeEconomy;
  }
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
  const type = requireString(body, "type");
  const data: Prisma.LocationUncheckedCreateInput = {
    locationName: requireString(body, "locationName"),
    type,
    ...parseOptionalFields(body),
  };
  // Per-item-type economy sliders are building-only.
  if (data.useItemTypeEconomy === true && !isBuildingType(type)) {
    throw badRequest();
  }
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

  // Per-item-type economy sliders are building-only. Whenever this PATCH
  // touches type or the flag, resolve the effective values (this PATCH's,
  // else the stored ones) and enforce it: reject an explicit request to turn
  // the toggle on for a non-building, or silently turn it back off if an
  // unrelated type change moves an already-advanced location out of
  // "building" (renaming a type shouldn't fail just because economy mode
  // happened to be on).
  if (data.type !== undefined || data.useItemTypeEconomy !== undefined) {
    const existing = await findLocationTypeAndFlag(id);
    if (!existing) throw notFound();
    const effectiveType =
      typeof data.type === "string" ? data.type : existing.type;
    const wantsAdvanced =
      typeof data.useItemTypeEconomy === "boolean"
        ? data.useItemTypeEconomy
        : existing.useItemTypeEconomy;

    if (wantsAdvanced && !isBuildingType(effectiveType)) {
      if (data.useItemTypeEconomy === true) {
        throw badRequest();
      }
      data.useItemTypeEconomy = false;
    }
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

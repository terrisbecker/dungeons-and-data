import { ItemType } from "@prisma/client";
import { mapPrismaError } from "../http/prisma-errors.js";
import { asRecord, optionalInt } from "../http/validate.js";
import {
  deleteLocationItemTypeEconomy,
  findLocationItemTypeEconomies,
  upsertLocationItemTypeEconomy,
} from "./location-item-economy.queries.js";

export function listLocationItemTypeEconomiesService(locationId: string) {
  return findLocationItemTypeEconomies(locationId);
}

export async function updateLocationItemTypeEconomyService(
  locationId: string,
  itemType: ItemType,
  rawBody: unknown,
) {
  const body = asRecord(rawBody);
  const data: { supplyLevel?: number; demandLevel?: number } = {};
  const supplyLevel = optionalInt(body, "supplyLevel");
  if (supplyLevel !== undefined) data.supplyLevel = supplyLevel;
  const demandLevel = optionalInt(body, "demandLevel");
  if (demandLevel !== undefined) data.demandLevel = demandLevel;

  try {
    return await upsertLocationItemTypeEconomy(locationId, itemType, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteLocationItemTypeEconomyService(
  locationId: string,
  itemType: ItemType,
): Promise<void> {
  try {
    await deleteLocationItemTypeEconomy(locationId, itemType);
  } catch (error) {
    mapPrismaError(error);
  }
}

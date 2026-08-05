import { ItemType, Prisma } from "@prisma/client";
import { badRequest } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import { asRecord } from "../http/validate.js";
import {
  findItemEconomyConfig,
  findItemEconomyConfigs,
  upsertItemEconomyConfig,
} from "./item-economy-configs.queries.js";

// The demandSlope column is a Prisma Decimal; expose it as a plain number,
// same discipline as challengeRating in creatures.service.ts.
function normalize<T extends { demandSlope: Prisma.Decimal }>(
  row: T,
): Omit<T, "demandSlope"> & { demandSlope: number } {
  return { ...row, demandSlope: row.demandSlope.toNumber() };
}

export async function listItemEconomyConfigsService() {
  const rows = await findItemEconomyConfigs();
  return rows.map(normalize);
}

export async function getItemEconomyConfigService(itemType: ItemType) {
  const row = await findItemEconomyConfig(itemType);
  // No row yet -> the column default (1.0) is the effective slope.
  return row ? normalize(row) : { itemType, demandSlope: 1 };
}

function requireDemandSlope(body: Record<string, unknown>): number {
  const value = body.demandSlope;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw badRequest();
  }
  return value;
}

export async function updateItemEconomyConfigService(
  itemType: ItemType,
  rawBody: unknown,
) {
  const demandSlope = requireDemandSlope(asRecord(rawBody));
  try {
    const row = await upsertItemEconomyConfig(itemType, demandSlope);
    return normalize(row);
  } catch (error) {
    mapPrismaError(error);
  }
}

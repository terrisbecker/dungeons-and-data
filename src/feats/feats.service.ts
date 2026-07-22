import { Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalBoolean,
  optionalString,
  requireString,
} from "../http/validate.js";
import {
  createFeat,
  deleteFeat,
  findFeatById,
  findFeats,
  updateFeat,
} from "./feats.queries.js";

// Fields settable on both create and update; only keys the caller provided are
// returned so PATCH stays partial.
function parseOptionalFields(
  body: Record<string, unknown>,
): Partial<Prisma.FeatUncheckedCreateInput> {
  const data: Partial<Prisma.FeatUncheckedCreateInput> = {};

  const set = <T>(key: string, value: T | undefined) => {
    if (value !== undefined) {
      (data as Record<string, unknown>)[key] = value;
    }
  };

  set("description", optionalString(body, "description"));
  set("prerequisite", optionalString(body, "prerequisite"));
  set("repeatable", optionalBoolean(body, "repeatable"));
  set(
    "grantsAbilityScoreIncrease",
    optionalBoolean(body, "grantsAbilityScoreIncrease"),
  );

  return data;
}

export async function createFeatService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.FeatUncheckedCreateInput = {
    name: requireString(body, "name"),
    ...parseOptionalFields(body),
  };
  try {
    return await createFeat(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listFeatsService() {
  return findFeats();
}

export async function getFeatService(id: string) {
  const row = await findFeatById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateFeatService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.FeatUncheckedUpdateInput = parseOptionalFields(body);
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  try {
    return await updateFeat(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteFeatService(id: string): Promise<void> {
  try {
    await deleteFeat(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

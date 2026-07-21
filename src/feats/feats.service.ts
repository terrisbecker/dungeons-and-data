import { Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import { asRecord, optionalString, requireString } from "../http/validate.js";
import {
  createFeat,
  deleteFeat,
  findFeatById,
  findFeats,
  updateFeat,
} from "./feats.queries.js";

export async function createFeatService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.FeatUncheckedCreateInput = {
    name: requireString(body, "name"),
  };
  const description = optionalString(body, "description");
  if (description !== undefined) data.description = description;
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
  const data: Prisma.FeatUncheckedUpdateInput = {};
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  const description = optionalString(body, "description");
  if (description !== undefined) data.description = description;
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

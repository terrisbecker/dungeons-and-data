import { FeatureSource, Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalEnum,
  optionalString,
  requireEnum,
  requireString,
} from "../http/validate.js";
import {
  createFeature,
  deleteFeature,
  findFeatureById,
  findFeatures,
  updateFeature,
} from "./features.queries.js";

const SOURCES = Object.values(FeatureSource);

export async function createFeatureService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.FeatureUncheckedCreateInput = {
    name: requireString(body, "name"),
    source: requireEnum(body, "source", SOURCES),
  };
  const description = optionalString(body, "description");
  if (description !== undefined) data.description = description;
  try {
    return await createFeature(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listFeaturesService() {
  return findFeatures();
}

export async function getFeatureService(id: string) {
  const row = await findFeatureById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateFeatureService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.FeatureUncheckedUpdateInput = {};
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  const source = optionalEnum(body, "source", SOURCES);
  if (source !== undefined) data.source = source;
  const description = optionalString(body, "description");
  if (description !== undefined) data.description = description;
  try {
    return await updateFeature(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteFeatureService(id: string): Promise<void> {
  try {
    await deleteFeature(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

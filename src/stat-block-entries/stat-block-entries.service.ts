import { Prisma, StatBlockEntryCategory } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalEnum,
  optionalInt,
  optionalString,
  requireEnum,
  requireString,
  requireUuidField,
} from "../http/validate.js";
import {
  createStatBlockEntry,
  deleteStatBlockEntry,
  findStatBlockEntries,
  findStatBlockEntryById,
  updateStatBlockEntry,
} from "./stat-block-entries.queries.js";

const CATEGORIES = Object.values(StatBlockEntryCategory);

function parseOptionalFields(
  body: Record<string, unknown>,
): Partial<Prisma.StatBlockEntryUncheckedCreateInput> {
  const data: Partial<Prisma.StatBlockEntryUncheckedCreateInput> = {};
  const sortOrder = optionalInt(body, "sortOrder", { min: 0 });
  if (sortOrder !== undefined) data.sortOrder = sortOrder;
  const legendaryCost = optionalInt(body, "legendaryCost", { min: 0 });
  if (legendaryCost !== undefined) data.legendaryCost = legendaryCost;
  return data;
}

export async function createStatBlockEntryService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.StatBlockEntryUncheckedCreateInput = {
    creatureId: requireUuidField(body, "creatureId"),
    category: requireEnum(body, "category", CATEGORIES),
    name: requireString(body, "name"),
    description: requireString(body, "description"),
    ...parseOptionalFields(body),
  };
  try {
    return await createStatBlockEntry(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listStatBlockEntriesService(creatureId: string) {
  return findStatBlockEntries(creatureId);
}

export async function getStatBlockEntryService(id: string) {
  const row = await findStatBlockEntryById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateStatBlockEntryService(
  id: string,
  rawBody: unknown,
) {
  const body = asRecord(rawBody);
  const data: Prisma.StatBlockEntryUncheckedUpdateInput =
    parseOptionalFields(body);
  const category = optionalEnum(body, "category", CATEGORIES);
  if (category !== undefined) data.category = category;
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  const description = optionalString(body, "description");
  if (description !== undefined) data.description = description;
  try {
    return await updateStatBlockEntry(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteStatBlockEntryService(id: string): Promise<void> {
  try {
    await deleteStatBlockEntry(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

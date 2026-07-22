import { DamageModifierKind, DamageType, Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalEnum,
  optionalString,
  requireEnum,
  requireUuidField,
} from "../http/validate.js";
import {
  createCreatureDamageModifier,
  deleteCreatureDamageModifier,
  findCreatureDamageModifierById,
  findCreatureDamageModifiers,
  updateCreatureDamageModifier,
} from "./creature-damage-modifiers.queries.js";

const KINDS = Object.values(DamageModifierKind);
const DAMAGE_TYPES = Object.values(DamageType);

function parseOptionalFields(
  body: Record<string, unknown>,
): Partial<Prisma.CreatureDamageModifierUncheckedCreateInput> {
  const data: Partial<Prisma.CreatureDamageModifierUncheckedCreateInput> = {};
  const damageType = optionalEnum(body, "damageType", DAMAGE_TYPES);
  if (damageType !== undefined) data.damageType = damageType;
  const note = optionalString(body, "note");
  if (note !== undefined) data.note = note;
  return data;
}

export async function createCreatureDamageModifierService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CreatureDamageModifierUncheckedCreateInput = {
    creatureId: requireUuidField(body, "creatureId"),
    kind: requireEnum(body, "kind", KINDS),
    ...parseOptionalFields(body),
  };
  try {
    return await createCreatureDamageModifier(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listCreatureDamageModifiersService(creatureId: string) {
  return findCreatureDamageModifiers(creatureId);
}

export async function getCreatureDamageModifierService(id: string) {
  const row = await findCreatureDamageModifierById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateCreatureDamageModifierService(
  id: string,
  rawBody: unknown,
) {
  const body = asRecord(rawBody);
  const data: Prisma.CreatureDamageModifierUncheckedUpdateInput =
    parseOptionalFields(body);
  const kind = optionalEnum(body, "kind", KINDS);
  if (kind !== undefined) data.kind = kind;
  try {
    return await updateCreatureDamageModifier(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteCreatureDamageModifierService(
  id: string,
): Promise<void> {
  try {
    await deleteCreatureDamageModifier(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

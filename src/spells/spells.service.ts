import { Ability, DamageType, Prisma, SpellSchool } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalBoolean,
  optionalEnum,
  optionalInt,
  optionalString,
  requireInt,
  requireString,
} from "../http/validate.js";
import {
  createSpell,
  deleteSpell,
  findSpellById,
  findSpells,
  updateSpell,
} from "./spells.queries.js";

const SCHOOLS = Object.values(SpellSchool);
const ABILITIES = Object.values(Ability);
const DAMAGE_TYPES = Object.values(DamageType);

// Fields settable on both create and update; only keys the caller provided are
// returned so PATCH stays partial.
function parseOptionalFields(
  body: Record<string, unknown>,
): Partial<Prisma.SpellUncheckedCreateInput> {
  const data: Partial<Prisma.SpellUncheckedCreateInput> = {};

  const set = <T>(key: string, value: T | undefined) => {
    if (value !== undefined) {
      (data as Record<string, unknown>)[key] = value;
    }
  };

  set("school", optionalEnum(body, "school", SCHOOLS));
  set("description", optionalString(body, "description"));
  set("castingTime", optionalString(body, "castingTime"));
  set("range", optionalString(body, "range"));
  set("duration", optionalString(body, "duration"));
  set("higherLevel", optionalString(body, "higherLevel"));
  set("verbal", optionalBoolean(body, "verbal"));
  set("somatic", optionalBoolean(body, "somatic"));
  set("material", optionalBoolean(body, "material"));
  set("materialComponent", optionalString(body, "materialComponent"));
  set("concentration", optionalBoolean(body, "concentration"));
  set("ritual", optionalBoolean(body, "ritual"));
  set("savingThrow", optionalEnum(body, "savingThrow", ABILITIES));
  set("damageType", optionalEnum(body, "damageType", DAMAGE_TYPES));
  set("isAttack", optionalBoolean(body, "isAttack"));

  return data;
}

export async function createSpellService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.SpellUncheckedCreateInput = {
    name: requireString(body, "name"),
    level: requireInt(body, "level", { min: 0, max: 9 }),
    ...parseOptionalFields(body),
  };
  try {
    return await createSpell(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listSpellsService() {
  return findSpells();
}

export async function getSpellService(id: string) {
  const row = await findSpellById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateSpellService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.SpellUncheckedUpdateInput = parseOptionalFields(body);
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  const level = optionalInt(body, "level", { min: 0, max: 9 });
  if (level !== undefined) data.level = level;
  try {
    return await updateSpell(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteSpellService(id: string): Promise<void> {
  try {
    await deleteSpell(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

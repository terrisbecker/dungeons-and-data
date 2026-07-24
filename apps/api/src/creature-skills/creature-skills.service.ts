import { Prisma, Skill, SkillProficiency } from "@prisma/client";
import { notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalEnum,
  requireEnum,
  requireUuidField,
} from "../http/validate.js";
import {
  createCreatureSkill,
  deleteCreatureSkill,
  findCreatureSkillById,
  findCreatureSkills,
  updateCreatureSkill,
} from "./creature-skills.queries.js";

const SKILLS = Object.values(Skill);
const PROFICIENCIES = Object.values(SkillProficiency);

export async function createCreatureSkillService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CreatureSkillUncheckedCreateInput = {
    creatureId: requireUuidField(body, "creatureId"),
    skill: requireEnum(body, "skill", SKILLS),
  };
  const proficiency = optionalEnum(body, "proficiency", PROFICIENCIES);
  if (proficiency !== undefined) data.proficiency = proficiency;
  try {
    return await createCreatureSkill(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listCreatureSkillsService(creatureId: string) {
  return findCreatureSkills(creatureId);
}

export async function getCreatureSkillService(id: string) {
  const row = await findCreatureSkillById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateCreatureSkillService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CreatureSkillUncheckedUpdateInput = {};
  const skill = optionalEnum(body, "skill", SKILLS);
  if (skill !== undefined) data.skill = skill;
  const proficiency = optionalEnum(body, "proficiency", PROFICIENCIES);
  if (proficiency !== undefined) data.proficiency = proficiency;
  try {
    return await updateCreatureSkill(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteCreatureSkillService(id: string): Promise<void> {
  try {
    await deleteCreatureSkill(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

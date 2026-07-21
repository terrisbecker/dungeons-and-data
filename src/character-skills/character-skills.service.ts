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
  createCharacterSkill,
  deleteCharacterSkill,
  findCharacterSkillById,
  findCharacterSkills,
  updateCharacterSkill,
} from "./character-skills.queries.js";

const SKILLS = Object.values(Skill);
const PROFICIENCIES = Object.values(SkillProficiency);

export async function createCharacterSkillService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterSkillUncheckedCreateInput = {
    characterId: requireUuidField(body, "characterId"),
    skill: requireEnum(body, "skill", SKILLS),
  };
  const proficiency = optionalEnum(body, "proficiency", PROFICIENCIES);
  if (proficiency !== undefined) data.proficiency = proficiency;
  try {
    return await createCharacterSkill(data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listCharacterSkillsService(characterId: string) {
  return findCharacterSkills(characterId);
}

export async function getCharacterSkillService(id: string) {
  const row = await findCharacterSkillById(id);
  if (!row) throw notFound();
  return row;
}

export async function updateCharacterSkillService(
  id: string,
  rawBody: unknown,
) {
  const body = asRecord(rawBody);
  const data: Prisma.CharacterSkillUncheckedUpdateInput = {};
  const skill = optionalEnum(body, "skill", SKILLS);
  if (skill !== undefined) data.skill = skill;
  const proficiency = optionalEnum(body, "proficiency", PROFICIENCIES);
  if (proficiency !== undefined) data.proficiency = proficiency;
  try {
    return await updateCharacterSkill(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteCharacterSkillService(id: string): Promise<void> {
  try {
    await deleteCharacterSkill(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createCharacterSkillService,
  deleteCharacterSkillService,
  getCharacterSkillService,
  listCharacterSkillsService,
  updateCharacterSkillService,
} from "./character-skills.service.js";

export async function postCharacterSkill(req: Request, res: Response) {
  res.status(201).json(await createCharacterSkillService(req.body));
}

export async function getCharacterSkills(req: Request, res: Response) {
  const characterId = requireUuid(req.query.characterId);
  res.json(await listCharacterSkillsService(characterId));
}

export async function getCharacterSkill(req: Request, res: Response) {
  res.json(await getCharacterSkillService(requireUuid(req.params.id)));
}

export async function patchCharacterSkill(req: Request, res: Response) {
  res.json(
    await updateCharacterSkillService(requireUuid(req.params.id), req.body),
  );
}

export async function deleteCharacterSkillHandler(req: Request, res: Response) {
  await deleteCharacterSkillService(requireUuid(req.params.id));
  res.status(204).send();
}

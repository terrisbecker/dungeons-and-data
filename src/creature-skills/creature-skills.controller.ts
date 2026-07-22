import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createCreatureSkillService,
  deleteCreatureSkillService,
  getCreatureSkillService,
  listCreatureSkillsService,
  updateCreatureSkillService,
} from "./creature-skills.service.js";

export async function postCreatureSkill(req: Request, res: Response) {
  res.status(201).json(await createCreatureSkillService(req.body));
}

export async function getCreatureSkills(req: Request, res: Response) {
  const creatureId = requireUuid(req.query.creatureId);
  res.json(await listCreatureSkillsService(creatureId));
}

export async function getCreatureSkill(req: Request, res: Response) {
  res.json(await getCreatureSkillService(requireUuid(req.params.id)));
}

export async function patchCreatureSkill(req: Request, res: Response) {
  res.json(
    await updateCreatureSkillService(requireUuid(req.params.id), req.body),
  );
}

export async function deleteCreatureSkillHandler(req: Request, res: Response) {
  await deleteCreatureSkillService(requireUuid(req.params.id));
  res.status(204).send();
}

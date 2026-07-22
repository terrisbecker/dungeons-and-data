import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createProficiencyService,
  deleteProficiencyService,
  getProficiencyService,
  listProficienciesService,
  updateProficiencyService,
} from "./proficiencies.service.js";

export async function postProficiency(req: Request, res: Response) {
  res.status(201).json(await createProficiencyService(req.body));
}

export async function getProficiencies(req: Request, res: Response) {
  const characterId = requireUuid(req.query.characterId);
  res.json(await listProficienciesService(characterId));
}

export async function getProficiency(req: Request, res: Response) {
  res.json(await getProficiencyService(requireUuid(req.params.id)));
}

export async function patchProficiency(req: Request, res: Response) {
  res.json(
    await updateProficiencyService(requireUuid(req.params.id), req.body),
  );
}

export async function deleteProficiencyHandler(req: Request, res: Response) {
  await deleteProficiencyService(requireUuid(req.params.id));
  res.status(204).send();
}

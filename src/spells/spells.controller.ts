import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createSpellService,
  deleteSpellService,
  getSpellService,
  listSpellsService,
  updateSpellService,
} from "./spells.service.js";

export async function postSpell(req: Request, res: Response) {
  res.status(201).json(await createSpellService(req.body));
}

export async function getSpells(_req: Request, res: Response) {
  res.json(await listSpellsService());
}

export async function getSpell(req: Request, res: Response) {
  res.json(await getSpellService(requireUuid(req.params.id)));
}

export async function patchSpell(req: Request, res: Response) {
  res.json(await updateSpellService(requireUuid(req.params.id), req.body));
}

export async function deleteSpellHandler(req: Request, res: Response) {
  await deleteSpellService(requireUuid(req.params.id));
  res.status(204).send();
}

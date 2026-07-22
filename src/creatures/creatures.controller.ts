import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createCreatureService,
  deleteCreatureService,
  getCreatureService,
  getCreatureSheetService,
  listCreaturesService,
  updateCreatureService,
} from "./creatures.service.js";

export async function postCreature(req: Request, res: Response) {
  res.status(201).json(await createCreatureService(req.body));
}

export async function getCreatures(_req: Request, res: Response) {
  res.json(await listCreaturesService());
}

export async function getCreature(req: Request, res: Response) {
  res.json(await getCreatureService(requireUuid(req.params.id)));
}

export async function getCreatureSheet(req: Request, res: Response) {
  res.json(await getCreatureSheetService(requireUuid(req.params.id)));
}

export async function patchCreature(req: Request, res: Response) {
  res.json(await updateCreatureService(requireUuid(req.params.id), req.body));
}

export async function deleteCreatureHandler(req: Request, res: Response) {
  await deleteCreatureService(requireUuid(req.params.id));
  res.status(204).send();
}

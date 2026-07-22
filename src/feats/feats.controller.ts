import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createFeatService,
  deleteFeatService,
  getFeatService,
  listFeatsService,
  updateFeatService,
} from "./feats.service.js";

export async function postFeat(req: Request, res: Response) {
  res.status(201).json(await createFeatService(req.body));
}

export async function getFeats(_req: Request, res: Response) {
  res.json(await listFeatsService());
}

export async function getFeat(req: Request, res: Response) {
  res.json(await getFeatService(requireUuid(req.params.id)));
}

export async function patchFeat(req: Request, res: Response) {
  res.json(await updateFeatService(requireUuid(req.params.id), req.body));
}

export async function deleteFeatHandler(req: Request, res: Response) {
  await deleteFeatService(requireUuid(req.params.id));
  res.status(204).send();
}

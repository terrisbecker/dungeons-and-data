import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createFeatureService,
  deleteFeatureService,
  getFeatureService,
  listFeaturesService,
  updateFeatureService,
} from "./features.service.js";

export async function postFeature(req: Request, res: Response) {
  res.status(201).json(await createFeatureService(req.body));
}

export async function getFeatures(_req: Request, res: Response) {
  res.json(await listFeaturesService());
}

export async function getFeature(req: Request, res: Response) {
  res.json(await getFeatureService(requireUuid(req.params.id)));
}

export async function patchFeature(req: Request, res: Response) {
  res.json(await updateFeatureService(requireUuid(req.params.id), req.body));
}

export async function deleteFeatureHandler(req: Request, res: Response) {
  await deleteFeatureService(requireUuid(req.params.id));
  res.status(204).send();
}

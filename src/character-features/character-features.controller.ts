import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createCharacterFeatureService,
  deleteCharacterFeatureService,
  getCharacterFeatureService,
  listCharacterFeaturesService,
  updateCharacterFeatureService,
} from "./character-features.service.js";

export async function postCharacterFeature(req: Request, res: Response) {
  res.status(201).json(await createCharacterFeatureService(req.body));
}

export async function getCharacterFeatures(req: Request, res: Response) {
  const characterId = requireUuid(req.query.characterId);
  res.json(await listCharacterFeaturesService(characterId));
}

export async function getCharacterFeature(req: Request, res: Response) {
  const characterId = requireUuid(req.params.characterId);
  const featureId = requireUuid(req.params.featureId);
  res.json(await getCharacterFeatureService(characterId, featureId));
}

export async function patchCharacterFeature(req: Request, res: Response) {
  const characterId = requireUuid(req.params.characterId);
  const featureId = requireUuid(req.params.featureId);
  res.json(
    await updateCharacterFeatureService(characterId, featureId, req.body),
  );
}

export async function deleteCharacterFeatureHandler(
  req: Request,
  res: Response,
) {
  const characterId = requireUuid(req.params.characterId);
  const featureId = requireUuid(req.params.featureId);
  await deleteCharacterFeatureService(characterId, featureId);
  res.status(204).send();
}

import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createCharacterFeatService,
  deleteCharacterFeatService,
  getCharacterFeatService,
  listCharacterFeatsService,
} from "./character-feats.service.js";

export async function postCharacterFeat(req: Request, res: Response) {
  res.status(201).json(await createCharacterFeatService(req.body));
}

export async function getCharacterFeats(req: Request, res: Response) {
  const characterId = requireUuid(req.query.characterId);
  res.json(await listCharacterFeatsService(characterId));
}

export async function getCharacterFeat(req: Request, res: Response) {
  const characterId = requireUuid(req.params.characterId);
  const featId = requireUuid(req.params.featId);
  res.json(await getCharacterFeatService(characterId, featId));
}

export async function deleteCharacterFeatHandler(req: Request, res: Response) {
  const characterId = requireUuid(req.params.characterId);
  const featId = requireUuid(req.params.featId);
  await deleteCharacterFeatService(characterId, featId);
  res.status(204).send();
}

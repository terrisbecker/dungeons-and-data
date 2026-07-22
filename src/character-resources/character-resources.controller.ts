import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createCharacterResourceService,
  deleteCharacterResourceService,
  getCharacterResourceService,
  listCharacterResourcesService,
  updateCharacterResourceService,
} from "./character-resources.service.js";

export async function postCharacterResource(req: Request, res: Response) {
  res.status(201).json(await createCharacterResourceService(req.body));
}

export async function getCharacterResources(req: Request, res: Response) {
  const characterId = requireUuid(req.query.characterId);
  res.json(await listCharacterResourcesService(characterId));
}

export async function getCharacterResource(req: Request, res: Response) {
  res.json(await getCharacterResourceService(requireUuid(req.params.id)));
}

export async function patchCharacterResource(req: Request, res: Response) {
  res.json(
    await updateCharacterResourceService(requireUuid(req.params.id), req.body),
  );
}

export async function deleteCharacterResourceHandler(
  req: Request,
  res: Response,
) {
  await deleteCharacterResourceService(requireUuid(req.params.id));
  res.status(204).send();
}

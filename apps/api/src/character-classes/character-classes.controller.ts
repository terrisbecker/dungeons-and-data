import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createCharacterClassService,
  deleteCharacterClassService,
  getCharacterClassService,
  listCharacterClassesService,
  updateCharacterClassService,
} from "./character-classes.service.js";

export async function postCharacterClass(req: Request, res: Response) {
  res.status(201).json(await createCharacterClassService(req.body));
}

export async function getCharacterClasses(req: Request, res: Response) {
  const characterId = requireUuid(req.query.characterId);
  res.json(await listCharacterClassesService(characterId));
}

export async function getCharacterClass(req: Request, res: Response) {
  res.json(await getCharacterClassService(requireUuid(req.params.id)));
}

export async function patchCharacterClass(req: Request, res: Response) {
  res.json(
    await updateCharacterClassService(requireUuid(req.params.id), req.body),
  );
}

export async function deleteCharacterClassHandler(req: Request, res: Response) {
  await deleteCharacterClassService(requireUuid(req.params.id));
  res.status(204).send();
}

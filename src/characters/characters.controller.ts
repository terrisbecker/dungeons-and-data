import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createCharacterService,
  deleteCharacterService,
  getCharacterService,
  getCharacterSheetService,
  listCharactersService,
  updateCharacterService,
} from "./characters.service.js";

export async function postCharacter(
  req: Request,
  res: Response,
): Promise<void> {
  const character = await createCharacterService(req.body);
  res.status(201).json(character);
}

export async function getCharacters(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json(await listCharactersService());
}

export async function getCharacter(req: Request, res: Response): Promise<void> {
  const id = requireUuid(req.params.id);
  res.json(await getCharacterService(id));
}

export async function getCharacterSheet(
  req: Request,
  res: Response,
): Promise<void> {
  const id = requireUuid(req.params.id);
  res.json(await getCharacterSheetService(id));
}

export async function patchCharacter(
  req: Request,
  res: Response,
): Promise<void> {
  const id = requireUuid(req.params.id);
  res.json(await updateCharacterService(id, req.body));
}

export async function deleteCharacter(
  req: Request,
  res: Response,
): Promise<void> {
  const id = requireUuid(req.params.id);
  await deleteCharacterService(id);
  res.status(204).send();
}

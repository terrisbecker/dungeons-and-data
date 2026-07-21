import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createCharacterSpellService,
  deleteCharacterSpellService,
  getCharacterSpellService,
  listCharacterSpellsService,
  updateCharacterSpellService,
} from "./character-spells.service.js";

export async function postCharacterSpell(req: Request, res: Response) {
  res.status(201).json(await createCharacterSpellService(req.body));
}

export async function getCharacterSpells(req: Request, res: Response) {
  const characterId = requireUuid(req.query.characterId);
  res.json(await listCharacterSpellsService(characterId));
}

export async function getCharacterSpell(req: Request, res: Response) {
  const characterId = requireUuid(req.params.characterId);
  const spellId = requireUuid(req.params.spellId);
  res.json(await getCharacterSpellService(characterId, spellId));
}

export async function patchCharacterSpell(req: Request, res: Response) {
  const characterId = requireUuid(req.params.characterId);
  const spellId = requireUuid(req.params.spellId);
  res.json(await updateCharacterSpellService(characterId, spellId, req.body));
}

export async function deleteCharacterSpellHandler(req: Request, res: Response) {
  const characterId = requireUuid(req.params.characterId);
  const spellId = requireUuid(req.params.spellId);
  await deleteCharacterSpellService(characterId, spellId);
  res.status(204).send();
}

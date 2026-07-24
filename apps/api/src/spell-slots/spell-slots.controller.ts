import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createSpellSlotService,
  deleteSpellSlotService,
  getSpellSlotService,
  listSpellSlotsService,
  updateSpellSlotService,
} from "./spell-slots.service.js";

export async function postSpellSlot(req: Request, res: Response) {
  res.status(201).json(await createSpellSlotService(req.body));
}

export async function getSpellSlots(req: Request, res: Response) {
  const characterId = requireUuid(req.query.characterId);
  res.json(await listSpellSlotsService(characterId));
}

export async function getSpellSlot(req: Request, res: Response) {
  res.json(await getSpellSlotService(requireUuid(req.params.id)));
}

export async function patchSpellSlot(req: Request, res: Response) {
  res.json(await updateSpellSlotService(requireUuid(req.params.id), req.body));
}

export async function deleteSpellSlotHandler(req: Request, res: Response) {
  await deleteSpellSlotService(requireUuid(req.params.id));
  res.status(204).send();
}

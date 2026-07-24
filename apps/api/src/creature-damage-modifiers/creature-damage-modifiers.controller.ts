import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createCreatureDamageModifierService,
  deleteCreatureDamageModifierService,
  getCreatureDamageModifierService,
  listCreatureDamageModifiersService,
  updateCreatureDamageModifierService,
} from "./creature-damage-modifiers.service.js";

export async function postCreatureDamageModifier(req: Request, res: Response) {
  res.status(201).json(await createCreatureDamageModifierService(req.body));
}

export async function getCreatureDamageModifiers(req: Request, res: Response) {
  const creatureId = requireUuid(req.query.creatureId);
  res.json(await listCreatureDamageModifiersService(creatureId));
}

export async function getCreatureDamageModifier(req: Request, res: Response) {
  res.json(await getCreatureDamageModifierService(requireUuid(req.params.id)));
}

export async function patchCreatureDamageModifier(req: Request, res: Response) {
  res.json(
    await updateCreatureDamageModifierService(
      requireUuid(req.params.id),
      req.body,
    ),
  );
}

export async function deleteCreatureDamageModifierHandler(
  req: Request,
  res: Response,
) {
  await deleteCreatureDamageModifierService(requireUuid(req.params.id));
  res.status(204).send();
}

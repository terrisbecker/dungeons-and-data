import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createCharacterConditionService,
  deleteCharacterConditionService,
  getCharacterConditionService,
  listCharacterConditionsService,
  updateCharacterConditionService,
} from "./character-conditions.service.js";

export async function postCharacterCondition(req: Request, res: Response) {
  res.status(201).json(await createCharacterConditionService(req.body));
}

export async function getCharacterConditions(req: Request, res: Response) {
  const characterId = requireUuid(req.query.characterId);
  res.json(await listCharacterConditionsService(characterId));
}

export async function getCharacterCondition(req: Request, res: Response) {
  res.json(await getCharacterConditionService(requireUuid(req.params.id)));
}

export async function patchCharacterCondition(req: Request, res: Response) {
  res.json(
    await updateCharacterConditionService(requireUuid(req.params.id), req.body),
  );
}

export async function deleteCharacterConditionHandler(
  req: Request,
  res: Response,
) {
  await deleteCharacterConditionService(requireUuid(req.params.id));
  res.status(204).send();
}

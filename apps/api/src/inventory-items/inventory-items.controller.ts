import type { Request, Response } from "express";
import { badRequest } from "../http/http-error.js";
import { requireUuid } from "../http/validate.js";
import {
  createInventoryItemService,
  deleteInventoryItemService,
  getInventoryItemService,
  listInventoryItemsService,
  updateInventoryItemService,
} from "./inventory-items.service.js";

export async function postInventoryItem(req: Request, res: Response) {
  res.status(201).json(await createInventoryItemService(req.body));
}

export async function getInventoryItems(req: Request, res: Response) {
  const { characterId, creatureId } = req.query;
  if (characterId === undefined && creatureId === undefined) {
    throw badRequest();
  }
  res.json(
    await listInventoryItemsService({
      characterId:
        characterId === undefined ? undefined : requireUuid(characterId),
      creatureId:
        creatureId === undefined ? undefined : requireUuid(creatureId),
    }),
  );
}

export async function getInventoryItem(req: Request, res: Response) {
  res.json(await getInventoryItemService(requireUuid(req.params.id)));
}

export async function patchInventoryItem(req: Request, res: Response) {
  res.json(
    await updateInventoryItemService(requireUuid(req.params.id), req.body),
  );
}

export async function deleteInventoryItemHandler(req: Request, res: Response) {
  await deleteInventoryItemService(requireUuid(req.params.id));
  res.status(204).send();
}

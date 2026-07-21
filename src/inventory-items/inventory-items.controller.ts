import type { Request, Response } from "express";
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
  const characterId = requireUuid(req.query.characterId);
  res.json(await listInventoryItemsService(characterId));
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

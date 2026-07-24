import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  createItemService,
  deleteItemService,
  getItemService,
  listItemsService,
  updateItemService,
} from "./items.service.js";

export async function postItem(req: Request, res: Response) {
  res.status(201).json(await createItemService(req.body));
}

export async function getItems(_req: Request, res: Response) {
  res.json(await listItemsService());
}

export async function getItem(req: Request, res: Response) {
  res.json(await getItemService(requireUuid(req.params.id)));
}

export async function patchItem(req: Request, res: Response) {
  res.json(await updateItemService(requireUuid(req.params.id), req.body));
}

export async function deleteItemHandler(req: Request, res: Response) {
  await deleteItemService(requireUuid(req.params.id));
  res.status(204).send();
}

import { ItemType } from "@prisma/client";
import type { Request, Response } from "express";
import { requireEnum, requireUuid } from "../http/validate.js";
import {
  deleteLocationItemTypeEconomyService,
  listLocationItemTypeEconomiesService,
  updateLocationItemTypeEconomyService,
} from "./location-item-economy.service.js";

const ITEM_TYPES = Object.values(ItemType);

function parseItemType(value: unknown): ItemType {
  return requireEnum({ itemType: value }, "itemType", ITEM_TYPES);
}

export async function getLocationItemTypeEconomies(
  req: Request,
  res: Response,
): Promise<void> {
  res.json(
    await listLocationItemTypeEconomiesService(
      requireUuid(req.query.locationId),
    ),
  );
}

export async function patchLocationItemTypeEconomy(
  req: Request,
  res: Response,
): Promise<void> {
  res.json(
    await updateLocationItemTypeEconomyService(
      requireUuid(req.params.locationId),
      parseItemType(req.params.itemType),
      req.body,
    ),
  );
}

export async function deleteLocationItemTypeEconomyHandler(
  req: Request,
  res: Response,
): Promise<void> {
  await deleteLocationItemTypeEconomyService(
    requireUuid(req.params.locationId),
    parseItemType(req.params.itemType),
  );
  res.status(204).send();
}

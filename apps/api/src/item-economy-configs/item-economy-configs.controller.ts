import { ItemType } from "@prisma/client";
import type { Request, Response } from "express";
import { requireEnum } from "../http/validate.js";
import {
  getItemEconomyConfigService,
  listItemEconomyConfigsService,
  updateItemEconomyConfigService,
} from "./item-economy-configs.service.js";

const ITEM_TYPES = Object.values(ItemType);

function parseItemType(value: unknown): ItemType {
  return requireEnum({ itemType: value }, "itemType", ITEM_TYPES);
}

export async function getItemEconomyConfigs(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json(await listItemEconomyConfigsService());
}

export async function getItemEconomyConfig(
  req: Request,
  res: Response,
): Promise<void> {
  res.json(
    await getItemEconomyConfigService(parseItemType(req.params.itemType)),
  );
}

export async function patchItemEconomyConfig(
  req: Request,
  res: Response,
): Promise<void> {
  res.json(
    await updateItemEconomyConfigService(
      parseItemType(req.params.itemType),
      req.body,
    ),
  );
}

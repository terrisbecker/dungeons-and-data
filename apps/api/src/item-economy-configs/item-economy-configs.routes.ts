import { Router } from "express";
import { guardCatalog } from "../auth/guards.js";
import {
  getItemEconomyConfig,
  getItemEconomyConfigs,
  patchItemEconomyConfig,
} from "./item-economy-configs.controller.js";

export const itemEconomyConfigsRouter = Router();

itemEconomyConfigsRouter.get("/", getItemEconomyConfigs);
itemEconomyConfigsRouter.get("/:itemType", getItemEconomyConfig);
itemEconomyConfigsRouter.patch(
  "/:itemType",
  guardCatalog,
  patchItemEconomyConfig,
);

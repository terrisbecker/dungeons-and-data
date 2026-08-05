import { Router } from "express";
import { guardLocationItemEconomyByParams } from "../auth/guards.js";
import {
  deleteLocationItemTypeEconomyHandler,
  getLocationItemTypeEconomies,
  patchLocationItemTypeEconomy,
} from "./location-item-economy.controller.js";

export const locationItemEconomyRouter = Router();

locationItemEconomyRouter.get("/", getLocationItemTypeEconomies);
locationItemEconomyRouter.patch(
  "/:locationId/:itemType",
  guardLocationItemEconomyByParams,
  patchLocationItemTypeEconomy,
);
locationItemEconomyRouter.delete(
  "/:locationId/:itemType",
  guardLocationItemEconomyByParams,
  deleteLocationItemTypeEconomyHandler,
);

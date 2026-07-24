import { Router } from "express";
import {
  guardInventoryByParamId,
  guardInventoryCreate,
} from "../auth/guards.js";
import {
  deleteInventoryItemHandler,
  getInventoryItem,
  getInventoryItems,
  patchInventoryItem,
  postInventoryItem,
} from "./inventory-items.controller.js";

export const inventoryItemsRouter = Router();

inventoryItemsRouter.post("/", guardInventoryCreate, postInventoryItem);
inventoryItemsRouter.get("/", getInventoryItems);
inventoryItemsRouter.get("/:id", getInventoryItem);
inventoryItemsRouter.patch("/:id", guardInventoryByParamId, patchInventoryItem);
inventoryItemsRouter.delete(
  "/:id",
  guardInventoryByParamId,
  deleteInventoryItemHandler,
);

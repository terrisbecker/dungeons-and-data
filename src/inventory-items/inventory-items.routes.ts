import { Router } from "express";
import {
  deleteInventoryItemHandler,
  getInventoryItem,
  getInventoryItems,
  patchInventoryItem,
  postInventoryItem,
} from "./inventory-items.controller.js";

export const inventoryItemsRouter = Router();

inventoryItemsRouter.post("/", postInventoryItem);
inventoryItemsRouter.get("/", getInventoryItems);
inventoryItemsRouter.get("/:id", getInventoryItem);
inventoryItemsRouter.patch("/:id", patchInventoryItem);
inventoryItemsRouter.delete("/:id", deleteInventoryItemHandler);

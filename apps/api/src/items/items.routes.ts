import { Router } from "express";
import { guardCatalog } from "../auth/guards.js";
import {
  deleteItemHandler,
  getItem,
  getItems,
  patchItem,
  postItem,
} from "./items.controller.js";

export const itemsRouter = Router();

itemsRouter.post("/", guardCatalog, postItem);
itemsRouter.get("/", getItems);
itemsRouter.get("/:id", getItem);
itemsRouter.patch("/:id", guardCatalog, patchItem);
itemsRouter.delete("/:id", guardCatalog, deleteItemHandler);

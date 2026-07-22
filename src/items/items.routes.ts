import { Router } from "express";
import {
  deleteItemHandler,
  getItem,
  getItems,
  patchItem,
  postItem,
} from "./items.controller.js";

export const itemsRouter = Router();

itemsRouter.post("/", postItem);
itemsRouter.get("/", getItems);
itemsRouter.get("/:id", getItem);
itemsRouter.patch("/:id", patchItem);
itemsRouter.delete("/:id", deleteItemHandler);

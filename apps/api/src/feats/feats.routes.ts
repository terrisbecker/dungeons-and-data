import { Router } from "express";
import { guardCatalog } from "../auth/guards.js";
import {
  deleteFeatHandler,
  getFeat,
  getFeats,
  patchFeat,
  postFeat,
} from "./feats.controller.js";

export const featsRouter = Router();

featsRouter.post("/", guardCatalog, postFeat);
featsRouter.get("/", getFeats);
featsRouter.get("/:id", getFeat);
featsRouter.patch("/:id", guardCatalog, patchFeat);
featsRouter.delete("/:id", guardCatalog, deleteFeatHandler);

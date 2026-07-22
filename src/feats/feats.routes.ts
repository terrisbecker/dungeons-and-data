import { Router } from "express";
import {
  deleteFeatHandler,
  getFeat,
  getFeats,
  patchFeat,
  postFeat,
} from "./feats.controller.js";

export const featsRouter = Router();

featsRouter.post("/", postFeat);
featsRouter.get("/", getFeats);
featsRouter.get("/:id", getFeat);
featsRouter.patch("/:id", patchFeat);
featsRouter.delete("/:id", deleteFeatHandler);

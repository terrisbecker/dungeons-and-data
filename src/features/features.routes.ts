import { Router } from "express";
import { guardCatalog } from "../auth/guards.js";
import {
  deleteFeatureHandler,
  getFeature,
  getFeatures,
  patchFeature,
  postFeature,
} from "./features.controller.js";

export const featuresRouter = Router();

featuresRouter.post("/", guardCatalog, postFeature);
featuresRouter.get("/", getFeatures);
featuresRouter.get("/:id", getFeature);
featuresRouter.patch("/:id", guardCatalog, patchFeature);
featuresRouter.delete("/:id", guardCatalog, deleteFeatureHandler);

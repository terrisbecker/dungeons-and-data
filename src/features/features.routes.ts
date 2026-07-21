import { Router } from "express";
import {
  deleteFeatureHandler,
  getFeature,
  getFeatures,
  patchFeature,
  postFeature,
} from "./features.controller.js";

export const featuresRouter = Router();

featuresRouter.post("/", postFeature);
featuresRouter.get("/", getFeatures);
featuresRouter.get("/:id", getFeature);
featuresRouter.patch("/:id", patchFeature);
featuresRouter.delete("/:id", deleteFeatureHandler);

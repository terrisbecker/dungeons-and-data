import { Router } from "express";
import {
  guardCharacterByBody,
  guardCharacterByParamCharacterId,
} from "../auth/guards.js";
import {
  deleteCharacterFeatureHandler,
  getCharacterFeature,
  getCharacterFeatures,
  patchCharacterFeature,
  postCharacterFeature,
} from "./character-features.controller.js";

export const characterFeaturesRouter = Router();

characterFeaturesRouter.post("/", guardCharacterByBody, postCharacterFeature);
characterFeaturesRouter.get("/", getCharacterFeatures);
characterFeaturesRouter.get("/:characterId/:featureId", getCharacterFeature);
characterFeaturesRouter.patch(
  "/:characterId/:featureId",
  guardCharacterByParamCharacterId,
  patchCharacterFeature,
);
characterFeaturesRouter.delete(
  "/:characterId/:featureId",
  guardCharacterByParamCharacterId,
  deleteCharacterFeatureHandler,
);

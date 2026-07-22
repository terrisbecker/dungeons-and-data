import { Router } from "express";
import {
  deleteCharacterFeatHandler,
  getCharacterFeat,
  getCharacterFeats,
  postCharacterFeat,
} from "./character-feats.controller.js";

export const characterFeatsRouter = Router();

characterFeatsRouter.post("/", postCharacterFeat);
characterFeatsRouter.get("/", getCharacterFeats);
characterFeatsRouter.get("/:characterId/:featId", getCharacterFeat);
characterFeatsRouter.delete(
  "/:characterId/:featId",
  deleteCharacterFeatHandler,
);

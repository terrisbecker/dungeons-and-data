import { Router } from "express";
import {
  guardCharacterByBody,
  guardCharacterByParamCharacterId,
} from "../auth/guards.js";
import {
  deleteCharacterFeatHandler,
  getCharacterFeat,
  getCharacterFeats,
  postCharacterFeat,
} from "./character-feats.controller.js";

export const characterFeatsRouter = Router();

characterFeatsRouter.post("/", guardCharacterByBody, postCharacterFeat);
characterFeatsRouter.get("/", getCharacterFeats);
characterFeatsRouter.get("/:characterId/:featId", getCharacterFeat);
characterFeatsRouter.delete(
  "/:characterId/:featId",
  guardCharacterByParamCharacterId,
  deleteCharacterFeatHandler,
);

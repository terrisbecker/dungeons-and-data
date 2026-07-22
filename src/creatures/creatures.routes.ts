import { Router } from "express";
import {
  deleteCreatureHandler,
  getCreature,
  getCreatures,
  getCreatureSheet,
  patchCreature,
  postCreature,
} from "./creatures.controller.js";

export const creaturesRouter = Router();

creaturesRouter.post("/", postCreature);
creaturesRouter.get("/", getCreatures);
creaturesRouter.get("/:id", getCreature);
creaturesRouter.get("/:id/sheet", getCreatureSheet);
creaturesRouter.patch("/:id", patchCreature);
creaturesRouter.delete("/:id", deleteCreatureHandler);

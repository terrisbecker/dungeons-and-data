import { Router } from "express";
import { guardCreatureByParamId, guardCreatureCreate } from "../auth/guards.js";
import {
  deleteCreatureHandler,
  getCreature,
  getCreatures,
  getCreatureSheet,
  patchCreature,
  postCreature,
} from "./creatures.controller.js";

export const creaturesRouter = Router();

creaturesRouter.post("/", guardCreatureCreate, postCreature);
creaturesRouter.get("/", getCreatures);
creaturesRouter.get("/:id", getCreature);
creaturesRouter.get("/:id/sheet", getCreatureSheet);
creaturesRouter.patch("/:id", guardCreatureByParamId, patchCreature);
creaturesRouter.delete("/:id", guardCreatureByParamId, deleteCreatureHandler);

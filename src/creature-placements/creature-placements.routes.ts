import { Router } from "express";
import {
  guardCreatureByBody,
  guardCreatureByParamCreatureId,
} from "../auth/guards.js";
import {
  deleteCreaturePlacementHandler,
  getCreaturePlacement,
  getCreaturePlacements,
  patchCreaturePlacement,
  postCreaturePlacement,
} from "./creature-placements.controller.js";

export const creaturePlacementsRouter = Router();

creaturePlacementsRouter.post("/", guardCreatureByBody, postCreaturePlacement);
creaturePlacementsRouter.get("/", getCreaturePlacements);
creaturePlacementsRouter.get("/:creatureId/:locationId", getCreaturePlacement);
creaturePlacementsRouter.patch(
  "/:creatureId/:locationId",
  guardCreatureByParamCreatureId,
  patchCreaturePlacement,
);
creaturePlacementsRouter.delete(
  "/:creatureId/:locationId",
  guardCreatureByParamCreatureId,
  deleteCreaturePlacementHandler,
);

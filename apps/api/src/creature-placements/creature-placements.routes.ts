import { Router } from "express";
import {
  guardCreaturePlacementByParams,
  guardCreaturePlacementCreate,
} from "../auth/guards.js";
import {
  deleteCreaturePlacementHandler,
  getCreaturePlacement,
  getCreaturePlacements,
  patchCreaturePlacement,
  postCreaturePlacement,
} from "./creature-placements.controller.js";

export const creaturePlacementsRouter = Router();

creaturePlacementsRouter.post(
  "/",
  guardCreaturePlacementCreate,
  postCreaturePlacement,
);
creaturePlacementsRouter.get("/", getCreaturePlacements);
creaturePlacementsRouter.get("/:creatureId/:locationId", getCreaturePlacement);
creaturePlacementsRouter.patch(
  "/:creatureId/:locationId",
  guardCreaturePlacementByParams,
  patchCreaturePlacement,
);
creaturePlacementsRouter.delete(
  "/:creatureId/:locationId",
  guardCreaturePlacementByParams,
  deleteCreaturePlacementHandler,
);

import { Router } from "express";
import {
  deleteCreaturePlacementHandler,
  getCreaturePlacement,
  getCreaturePlacements,
  patchCreaturePlacement,
  postCreaturePlacement,
} from "./creature-placements.controller.js";

export const creaturePlacementsRouter = Router();

creaturePlacementsRouter.post("/", postCreaturePlacement);
creaturePlacementsRouter.get("/", getCreaturePlacements);
creaturePlacementsRouter.get("/:creatureId/:locationId", getCreaturePlacement);
creaturePlacementsRouter.patch(
  "/:creatureId/:locationId",
  patchCreaturePlacement,
);
creaturePlacementsRouter.delete(
  "/:creatureId/:locationId",
  deleteCreaturePlacementHandler,
);

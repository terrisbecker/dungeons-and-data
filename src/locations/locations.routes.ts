import { Router } from "express";
import {
  deleteLocationHandler,
  getLocation,
  getLocations,
  patchLocation,
  postLocation,
} from "./locations.controller.js";

export const locationsRouter = Router();

locationsRouter.post("/", postLocation);
locationsRouter.get("/", getLocations);
locationsRouter.get("/:id", getLocation);
locationsRouter.patch("/:id", patchLocation);
locationsRouter.delete("/:id", deleteLocationHandler);

import { Router } from "express";
import { guardLocationByParamId, guardLocationCreate } from "../auth/guards.js";
import {
  deleteLocationHandler,
  getLocation,
  getLocations,
  patchLocation,
  postLocation,
} from "./locations.controller.js";

export const locationsRouter = Router();

locationsRouter.post("/", guardLocationCreate, postLocation);
locationsRouter.get("/", getLocations);
locationsRouter.get("/:id", getLocation);
locationsRouter.patch("/:id", guardLocationByParamId, patchLocation);
locationsRouter.delete("/:id", guardLocationByParamId, deleteLocationHandler);

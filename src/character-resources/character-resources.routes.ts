import { Router } from "express";
import {
  deleteCharacterResourceHandler,
  getCharacterResource,
  getCharacterResources,
  patchCharacterResource,
  postCharacterResource,
} from "./character-resources.controller.js";

export const characterResourcesRouter = Router();

characterResourcesRouter.post("/", postCharacterResource);
characterResourcesRouter.get("/", getCharacterResources);
characterResourcesRouter.get("/:id", getCharacterResource);
characterResourcesRouter.patch("/:id", patchCharacterResource);
characterResourcesRouter.delete("/:id", deleteCharacterResourceHandler);

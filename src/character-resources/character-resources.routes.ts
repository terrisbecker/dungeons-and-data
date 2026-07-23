import { Router } from "express";
import {
  guardCharacterByBody,
  guardCharacterResourceByParam,
} from "../auth/guards.js";
import {
  deleteCharacterResourceHandler,
  getCharacterResource,
  getCharacterResources,
  patchCharacterResource,
  postCharacterResource,
} from "./character-resources.controller.js";

export const characterResourcesRouter = Router();

characterResourcesRouter.post("/", guardCharacterByBody, postCharacterResource);
characterResourcesRouter.get("/", getCharacterResources);
characterResourcesRouter.get("/:id", getCharacterResource);
characterResourcesRouter.patch(
  "/:id",
  guardCharacterResourceByParam,
  patchCharacterResource,
);
characterResourcesRouter.delete(
  "/:id",
  guardCharacterResourceByParam,
  deleteCharacterResourceHandler,
);

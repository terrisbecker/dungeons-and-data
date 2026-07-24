import { Router } from "express";
import {
  guardCharacterByBody,
  guardCharacterClassByParam,
} from "../auth/guards.js";
import {
  deleteCharacterClassHandler,
  getCharacterClass,
  getCharacterClasses,
  patchCharacterClass,
  postCharacterClass,
} from "./character-classes.controller.js";

export const characterClassesRouter = Router();

characterClassesRouter.post("/", guardCharacterByBody, postCharacterClass);
characterClassesRouter.get("/", getCharacterClasses);
characterClassesRouter.get("/:id", getCharacterClass);
characterClassesRouter.patch(
  "/:id",
  guardCharacterClassByParam,
  patchCharacterClass,
);
characterClassesRouter.delete(
  "/:id",
  guardCharacterClassByParam,
  deleteCharacterClassHandler,
);

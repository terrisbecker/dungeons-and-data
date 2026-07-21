import { Router } from "express";
import {
  deleteCharacterClassHandler,
  getCharacterClass,
  getCharacterClasses,
  patchCharacterClass,
  postCharacterClass,
} from "./character-classes.controller.js";

export const characterClassesRouter = Router();

characterClassesRouter.post("/", postCharacterClass);
characterClassesRouter.get("/", getCharacterClasses);
characterClassesRouter.get("/:id", getCharacterClass);
characterClassesRouter.patch("/:id", patchCharacterClass);
characterClassesRouter.delete("/:id", deleteCharacterClassHandler);

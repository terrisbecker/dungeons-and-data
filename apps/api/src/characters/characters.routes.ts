import { Router } from "express";
import {
  guardCharacterByParamId,
  guardCharacterCreate,
} from "../auth/guards.js";
import {
  deleteCharacter,
  getCharacter,
  getCharacters,
  getCharacterSheet,
  patchCharacter,
  postCharacter,
} from "./characters.controller.js";

export const charactersRouter = Router();

charactersRouter.post("/", guardCharacterCreate, postCharacter);
charactersRouter.get("/", getCharacters);
charactersRouter.get("/:id", getCharacter);
charactersRouter.get("/:id/sheet", getCharacterSheet);
charactersRouter.patch("/:id", guardCharacterByParamId, patchCharacter);
charactersRouter.delete("/:id", guardCharacterByParamId, deleteCharacter);

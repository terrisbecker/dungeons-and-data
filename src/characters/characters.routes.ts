import { Router } from "express";
import {
  deleteCharacter,
  getCharacter,
  getCharacters,
  getCharacterSheet,
  patchCharacter,
  postCharacter,
} from "./characters.controller.js";

export const charactersRouter = Router();

charactersRouter.post("/", postCharacter);
charactersRouter.get("/", getCharacters);
charactersRouter.get("/:id", getCharacter);
charactersRouter.get("/:id/sheet", getCharacterSheet);
charactersRouter.patch("/:id", patchCharacter);
charactersRouter.delete("/:id", deleteCharacter);

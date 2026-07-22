import { Router } from "express";
import {
  deleteCharacterSpellHandler,
  getCharacterSpell,
  getCharacterSpells,
  patchCharacterSpell,
  postCharacterSpell,
} from "./character-spells.controller.js";

export const characterSpellsRouter = Router();

characterSpellsRouter.post("/", postCharacterSpell);
characterSpellsRouter.get("/", getCharacterSpells);
characterSpellsRouter.get("/:characterId/:spellId", getCharacterSpell);
characterSpellsRouter.patch("/:characterId/:spellId", patchCharacterSpell);
characterSpellsRouter.delete(
  "/:characterId/:spellId",
  deleteCharacterSpellHandler,
);

import { Router } from "express";
import {
  guardCharacterByBody,
  guardCharacterByParamCharacterId,
} from "../auth/guards.js";
import {
  deleteCharacterSpellHandler,
  getCharacterSpell,
  getCharacterSpells,
  patchCharacterSpell,
  postCharacterSpell,
} from "./character-spells.controller.js";

export const characterSpellsRouter = Router();

characterSpellsRouter.post("/", guardCharacterByBody, postCharacterSpell);
characterSpellsRouter.get("/", getCharacterSpells);
characterSpellsRouter.get("/:characterId/:spellId", getCharacterSpell);
characterSpellsRouter.patch(
  "/:characterId/:spellId",
  guardCharacterByParamCharacterId,
  patchCharacterSpell,
);
characterSpellsRouter.delete(
  "/:characterId/:spellId",
  guardCharacterByParamCharacterId,
  deleteCharacterSpellHandler,
);

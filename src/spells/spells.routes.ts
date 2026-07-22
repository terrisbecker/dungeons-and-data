import { Router } from "express";
import {
  deleteSpellHandler,
  getSpell,
  getSpells,
  patchSpell,
  postSpell,
} from "./spells.controller.js";

export const spellsRouter = Router();

spellsRouter.post("/", postSpell);
spellsRouter.get("/", getSpells);
spellsRouter.get("/:id", getSpell);
spellsRouter.patch("/:id", patchSpell);
spellsRouter.delete("/:id", deleteSpellHandler);

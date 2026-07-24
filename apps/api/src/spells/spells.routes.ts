import { Router } from "express";
import { guardCatalog } from "../auth/guards.js";
import {
  deleteSpellHandler,
  getSpell,
  getSpells,
  patchSpell,
  postSpell,
} from "./spells.controller.js";

export const spellsRouter = Router();

spellsRouter.post("/", guardCatalog, postSpell);
spellsRouter.get("/", getSpells);
spellsRouter.get("/:id", getSpell);
spellsRouter.patch("/:id", guardCatalog, patchSpell);
spellsRouter.delete("/:id", guardCatalog, deleteSpellHandler);

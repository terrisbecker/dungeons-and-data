import { Router } from "express";
import {
  deleteSpellSlotHandler,
  getSpellSlot,
  getSpellSlots,
  patchSpellSlot,
  postSpellSlot,
} from "./spell-slots.controller.js";

export const spellSlotsRouter = Router();

spellSlotsRouter.post("/", postSpellSlot);
spellSlotsRouter.get("/", getSpellSlots);
spellSlotsRouter.get("/:id", getSpellSlot);
spellSlotsRouter.patch("/:id", patchSpellSlot);
spellSlotsRouter.delete("/:id", deleteSpellSlotHandler);

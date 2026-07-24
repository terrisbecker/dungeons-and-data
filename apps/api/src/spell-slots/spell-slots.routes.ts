import { Router } from "express";
import { guardCharacterByBody, guardSpellSlotByParam } from "../auth/guards.js";
import {
  deleteSpellSlotHandler,
  getSpellSlot,
  getSpellSlots,
  patchSpellSlot,
  postSpellSlot,
} from "./spell-slots.controller.js";

export const spellSlotsRouter = Router();

spellSlotsRouter.post("/", guardCharacterByBody, postSpellSlot);
spellSlotsRouter.get("/", getSpellSlots);
spellSlotsRouter.get("/:id", getSpellSlot);
spellSlotsRouter.patch("/:id", guardSpellSlotByParam, patchSpellSlot);
spellSlotsRouter.delete("/:id", guardSpellSlotByParam, deleteSpellSlotHandler);

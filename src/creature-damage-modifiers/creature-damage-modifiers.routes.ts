import { Router } from "express";
import {
  deleteCreatureDamageModifierHandler,
  getCreatureDamageModifier,
  getCreatureDamageModifiers,
  patchCreatureDamageModifier,
  postCreatureDamageModifier,
} from "./creature-damage-modifiers.controller.js";

export const creatureDamageModifiersRouter = Router();

creatureDamageModifiersRouter.post("/", postCreatureDamageModifier);
creatureDamageModifiersRouter.get("/", getCreatureDamageModifiers);
creatureDamageModifiersRouter.get("/:id", getCreatureDamageModifier);
creatureDamageModifiersRouter.patch("/:id", patchCreatureDamageModifier);
creatureDamageModifiersRouter.delete(
  "/:id",
  deleteCreatureDamageModifierHandler,
);

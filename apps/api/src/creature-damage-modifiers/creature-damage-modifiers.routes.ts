import { Router } from "express";
import {
  guardCreatureByBody,
  guardCreatureDamageModifierByParam,
} from "../auth/guards.js";
import {
  deleteCreatureDamageModifierHandler,
  getCreatureDamageModifier,
  getCreatureDamageModifiers,
  patchCreatureDamageModifier,
  postCreatureDamageModifier,
} from "./creature-damage-modifiers.controller.js";

export const creatureDamageModifiersRouter = Router();

creatureDamageModifiersRouter.post(
  "/",
  guardCreatureByBody,
  postCreatureDamageModifier,
);
creatureDamageModifiersRouter.get("/", getCreatureDamageModifiers);
creatureDamageModifiersRouter.get("/:id", getCreatureDamageModifier);
creatureDamageModifiersRouter.patch(
  "/:id",
  guardCreatureDamageModifierByParam,
  patchCreatureDamageModifier,
);
creatureDamageModifiersRouter.delete(
  "/:id",
  guardCreatureDamageModifierByParam,
  deleteCreatureDamageModifierHandler,
);

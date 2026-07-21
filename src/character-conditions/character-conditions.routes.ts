import { Router } from "express";
import {
  deleteCharacterConditionHandler,
  getCharacterCondition,
  getCharacterConditions,
  patchCharacterCondition,
  postCharacterCondition,
} from "./character-conditions.controller.js";

export const characterConditionsRouter = Router();

characterConditionsRouter.post("/", postCharacterCondition);
characterConditionsRouter.get("/", getCharacterConditions);
characterConditionsRouter.get("/:id", getCharacterCondition);
characterConditionsRouter.patch("/:id", patchCharacterCondition);
characterConditionsRouter.delete("/:id", deleteCharacterConditionHandler);

import { Router } from "express";
import {
  guardCharacterByBody,
  guardCharacterConditionByParam,
} from "../auth/guards.js";
import {
  deleteCharacterConditionHandler,
  getCharacterCondition,
  getCharacterConditions,
  patchCharacterCondition,
  postCharacterCondition,
} from "./character-conditions.controller.js";

export const characterConditionsRouter = Router();

characterConditionsRouter.post(
  "/",
  guardCharacterByBody,
  postCharacterCondition,
);
characterConditionsRouter.get("/", getCharacterConditions);
characterConditionsRouter.get("/:id", getCharacterCondition);
characterConditionsRouter.patch(
  "/:id",
  guardCharacterConditionByParam,
  patchCharacterCondition,
);
characterConditionsRouter.delete(
  "/:id",
  guardCharacterConditionByParam,
  deleteCharacterConditionHandler,
);

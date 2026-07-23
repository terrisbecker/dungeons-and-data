import { Router } from "express";
import {
  guardCharacterByBody,
  guardProficiencyByParam,
} from "../auth/guards.js";
import {
  deleteProficiencyHandler,
  getProficiencies,
  getProficiency,
  patchProficiency,
  postProficiency,
} from "./proficiencies.controller.js";

export const proficienciesRouter = Router();

proficienciesRouter.post("/", guardCharacterByBody, postProficiency);
proficienciesRouter.get("/", getProficiencies);
proficienciesRouter.get("/:id", getProficiency);
proficienciesRouter.patch("/:id", guardProficiencyByParam, patchProficiency);
proficienciesRouter.delete(
  "/:id",
  guardProficiencyByParam,
  deleteProficiencyHandler,
);

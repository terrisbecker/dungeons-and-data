import { Router } from "express";
import {
  deleteProficiencyHandler,
  getProficiencies,
  getProficiency,
  patchProficiency,
  postProficiency,
} from "./proficiencies.controller.js";

export const proficienciesRouter = Router();

proficienciesRouter.post("/", postProficiency);
proficienciesRouter.get("/", getProficiencies);
proficienciesRouter.get("/:id", getProficiency);
proficienciesRouter.patch("/:id", patchProficiency);
proficienciesRouter.delete("/:id", deleteProficiencyHandler);

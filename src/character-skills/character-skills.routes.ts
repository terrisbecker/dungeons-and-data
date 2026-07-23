import { Router } from "express";
import {
  guardCharacterByBody,
  guardCharacterSkillByParam,
} from "../auth/guards.js";
import {
  deleteCharacterSkillHandler,
  getCharacterSkill,
  getCharacterSkills,
  patchCharacterSkill,
  postCharacterSkill,
} from "./character-skills.controller.js";

export const characterSkillsRouter = Router();

characterSkillsRouter.post("/", guardCharacterByBody, postCharacterSkill);
characterSkillsRouter.get("/", getCharacterSkills);
characterSkillsRouter.get("/:id", getCharacterSkill);
characterSkillsRouter.patch(
  "/:id",
  guardCharacterSkillByParam,
  patchCharacterSkill,
);
characterSkillsRouter.delete(
  "/:id",
  guardCharacterSkillByParam,
  deleteCharacterSkillHandler,
);

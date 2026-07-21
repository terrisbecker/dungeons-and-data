import { Router } from "express";
import {
  deleteCharacterSkillHandler,
  getCharacterSkill,
  getCharacterSkills,
  patchCharacterSkill,
  postCharacterSkill,
} from "./character-skills.controller.js";

export const characterSkillsRouter = Router();

characterSkillsRouter.post("/", postCharacterSkill);
characterSkillsRouter.get("/", getCharacterSkills);
characterSkillsRouter.get("/:id", getCharacterSkill);
characterSkillsRouter.patch("/:id", patchCharacterSkill);
characterSkillsRouter.delete("/:id", deleteCharacterSkillHandler);

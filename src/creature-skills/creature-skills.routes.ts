import { Router } from "express";
import {
  deleteCreatureSkillHandler,
  getCreatureSkill,
  getCreatureSkills,
  patchCreatureSkill,
  postCreatureSkill,
} from "./creature-skills.controller.js";

export const creatureSkillsRouter = Router();

creatureSkillsRouter.post("/", postCreatureSkill);
creatureSkillsRouter.get("/", getCreatureSkills);
creatureSkillsRouter.get("/:id", getCreatureSkill);
creatureSkillsRouter.patch("/:id", patchCreatureSkill);
creatureSkillsRouter.delete("/:id", deleteCreatureSkillHandler);

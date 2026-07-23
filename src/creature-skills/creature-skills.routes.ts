import { Router } from "express";
import {
  guardCreatureByBody,
  guardCreatureSkillByParam,
} from "../auth/guards.js";
import {
  deleteCreatureSkillHandler,
  getCreatureSkill,
  getCreatureSkills,
  patchCreatureSkill,
  postCreatureSkill,
} from "./creature-skills.controller.js";

export const creatureSkillsRouter = Router();

creatureSkillsRouter.post("/", guardCreatureByBody, postCreatureSkill);
creatureSkillsRouter.get("/", getCreatureSkills);
creatureSkillsRouter.get("/:id", getCreatureSkill);
creatureSkillsRouter.patch(
  "/:id",
  guardCreatureSkillByParam,
  patchCreatureSkill,
);
creatureSkillsRouter.delete(
  "/:id",
  guardCreatureSkillByParam,
  deleteCreatureSkillHandler,
);

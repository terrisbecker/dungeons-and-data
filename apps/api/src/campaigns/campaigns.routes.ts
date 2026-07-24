import { Router } from "express";
import { guardCampaignByParamId } from "../auth/guards.js";
import {
  deleteCampaignHandler,
  getCampaign,
  getCampaigns,
  joinCampaign,
  patchCampaign,
  postCampaign,
} from "./campaigns.controller.js";

export const campaignsRouter = Router();

// Any authenticated user may create a campaign (they become its DM).
campaignsRouter.post("/", postCampaign);
// Self-service join by pasted campaign id — seats the caller as a PLAYER. No
// guard: the seat is always for req.auth.playerId, so this only affects self.
campaignsRouter.post("/:id/join", joinCampaign);
campaignsRouter.get("/", getCampaigns);
campaignsRouter.get("/:id", getCampaign);
campaignsRouter.patch("/:id", guardCampaignByParamId, patchCampaign);
campaignsRouter.delete("/:id", guardCampaignByParamId, deleteCampaignHandler);

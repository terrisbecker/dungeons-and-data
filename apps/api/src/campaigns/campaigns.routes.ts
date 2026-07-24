import { Router } from "express";
import { guardCampaignByParamId } from "../auth/guards.js";
import {
  deleteCampaignHandler,
  getCampaign,
  getCampaigns,
  patchCampaign,
  postCampaign,
} from "./campaigns.controller.js";

export const campaignsRouter = Router();

// Any authenticated user may create a campaign (they become its DM).
campaignsRouter.post("/", postCampaign);
campaignsRouter.get("/", getCampaigns);
campaignsRouter.get("/:id", getCampaign);
campaignsRouter.patch("/:id", guardCampaignByParamId, patchCampaign);
campaignsRouter.delete("/:id", guardCampaignByParamId, deleteCampaignHandler);

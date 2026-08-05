import { Router } from "express";
import { guardCampaignEconomySettingsByParamId } from "../auth/guards.js";
import {
  getCampaignEconomySettings,
  patchCampaignEconomySettings,
} from "./campaign-economy-settings.controller.js";

export const campaignEconomySettingsRouter = Router();

campaignEconomySettingsRouter.get("/:campaignId", getCampaignEconomySettings);
campaignEconomySettingsRouter.patch(
  "/:campaignId",
  guardCampaignEconomySettingsByParamId,
  patchCampaignEconomySettings,
);

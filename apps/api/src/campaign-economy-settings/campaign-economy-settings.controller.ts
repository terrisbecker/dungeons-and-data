import type { Request, Response } from "express";
import { requireUuid } from "../http/validate.js";
import {
  getCampaignEconomySettingsService,
  updateCampaignEconomySettingsService,
} from "./campaign-economy-settings.service.js";

export async function getCampaignEconomySettings(
  req: Request,
  res: Response,
): Promise<void> {
  res.json(
    await getCampaignEconomySettingsService(requireUuid(req.params.campaignId)),
  );
}

export async function patchCampaignEconomySettings(
  req: Request,
  res: Response,
): Promise<void> {
  res.json(
    await updateCampaignEconomySettingsService(
      requireUuid(req.params.campaignId),
      req.body,
    ),
  );
}

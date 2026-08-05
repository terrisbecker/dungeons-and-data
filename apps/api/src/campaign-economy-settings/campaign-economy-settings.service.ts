import { mapPrismaError } from "../http/prisma-errors.js";
import { asRecord, optionalBoolean, optionalInt } from "../http/validate.js";
import {
  findCampaignEconomySettings,
  upsertCampaignEconomySettings,
} from "./campaign-economy-settings.queries.js";

// A campaign has no settings row until the DM first touches it — surface
// these defaults on GET rather than 404ing, so the frontend can render the
// toggle/floor/ceiling form before anything has ever been saved.
const DEFAULTS = {
  economyEnabled: false,
  floorPercent: 50,
  ceilingPercent: 50,
};

export async function getCampaignEconomySettingsService(campaignId: string) {
  const row = await findCampaignEconomySettings(campaignId);
  return row ?? { campaignId, ...DEFAULTS };
}

export async function updateCampaignEconomySettingsService(
  campaignId: string,
  rawBody: unknown,
) {
  const body = asRecord(rawBody);
  const data: {
    economyEnabled?: boolean;
    floorPercent?: number;
    ceilingPercent?: number;
  } = {};

  const economyEnabled = optionalBoolean(body, "economyEnabled");
  if (economyEnabled !== undefined) data.economyEnabled = economyEnabled;
  const floorPercent = optionalInt(body, "floorPercent", { min: 0, max: 100 });
  if (floorPercent !== undefined) data.floorPercent = floorPercent;
  const ceilingPercent = optionalInt(body, "ceilingPercent", {
    min: 0,
    max: 100,
  });
  if (ceilingPercent !== undefined) data.ceilingPercent = ceilingPercent;

  try {
    return await upsertCampaignEconomySettings(campaignId, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

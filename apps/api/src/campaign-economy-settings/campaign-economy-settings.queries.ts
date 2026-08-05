import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  campaignId: true,
  economyEnabled: true,
  floorPercent: true,
  ceilingPercent: true,
} satisfies Prisma.CampaignEconomySettingsSelect;

export function findCampaignEconomySettings(campaignId: string) {
  return prisma.campaignEconomySettings.findUnique({
    where: { campaignId },
    select,
  });
}

// No row exists until the first PATCH, so writes upsert rather than update.
export function upsertCampaignEconomySettings(
  campaignId: string,
  data: Partial<Prisma.CampaignEconomySettingsUncheckedCreateInput>,
) {
  return prisma.campaignEconomySettings.upsert({
    where: { campaignId },
    create: { campaignId, ...data },
    update: data,
    select,
  });
}

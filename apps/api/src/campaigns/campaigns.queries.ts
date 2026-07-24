import { CampaignRole, Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const campaignSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CampaignSelect;

// Detail read joins the roster (membership role + player summary).
const campaignDetailSelect = {
  ...campaignSelect,
  memberships: {
    orderBy: { joinedAt: "asc" },
    select: {
      id: true,
      role: true,
      joinedAt: true,
      player: { select: { id: true, username: true, displayName: true } },
    },
  },
} satisfies Prisma.CampaignSelect;

// Create the campaign and, in the same write, seat the creator as its first DM
// (satisfies the schema's "≥1 DM per campaign" invariant).
export function createCampaign(
  data: Prisma.CampaignCreateInput,
  creatorPlayerId: string,
) {
  return prisma.campaign.create({
    data: {
      ...data,
      memberships: {
        create: {
          playerId: creatorPlayerId,
          role: CampaignRole.DUNGEON_MASTER,
        },
      },
    },
    select: campaignDetailSelect,
  });
}

export function findCampaigns() {
  return prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    select: campaignSelect,
  });
}

export function findCampaignById(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    select: campaignDetailSelect,
  });
}

// Seat a player in a campaign as a PLAYER. Used by the self-service join flow;
// the player id always comes from the caller's token, never the request body.
export function joinCampaignAsPlayer(campaignId: string, playerId: string) {
  return prisma.campaignMembership.create({
    data: { campaignId, playerId, role: CampaignRole.PLAYER },
    select: {
      id: true,
      campaignId: true,
      playerId: true,
      role: true,
      joinedAt: true,
    },
  });
}

export function updateCampaign(
  id: string,
  data: Prisma.CampaignUncheckedUpdateInput,
) {
  return prisma.campaign.update({
    where: { id },
    data,
    select: campaignSelect,
  });
}

export function deleteCampaign(id: string) {
  return prisma.campaign.delete({ where: { id } });
}

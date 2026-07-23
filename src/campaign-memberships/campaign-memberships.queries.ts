import { CampaignRole, Prisma } from "@prisma/client";
import { prisma } from "../db.js";

const select = {
  id: true,
  campaignId: true,
  playerId: true,
  role: true,
  joinedAt: true,
  player: { select: { id: true, username: true, displayName: true } },
} satisfies Prisma.CampaignMembershipSelect;

export function createMembership(
  data: Prisma.CampaignMembershipUncheckedCreateInput,
) {
  return prisma.campaignMembership.create({ data, select });
}

export function findMemberships(where: Prisma.CampaignMembershipWhereInput) {
  return prisma.campaignMembership.findMany({
    where,
    orderBy: { joinedAt: "asc" },
    select,
  });
}

export function findMembershipById(id: string) {
  return prisma.campaignMembership.findUnique({ where: { id }, select });
}

export function updateMembership(
  id: string,
  data: Prisma.CampaignMembershipUncheckedUpdateInput,
) {
  return prisma.campaignMembership.update({ where: { id }, data, select });
}

export function deleteMembership(id: string) {
  return prisma.campaignMembership.delete({ where: { id } });
}

// How many DMs a campaign currently has — used to protect the last one.
export function countDms(campaignId: string) {
  return prisma.campaignMembership.count({
    where: { campaignId, role: CampaignRole.DUNGEON_MASTER },
  });
}

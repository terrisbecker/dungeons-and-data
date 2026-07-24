import { CampaignRole, Prisma } from "@prisma/client";
import { conflict, notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import { asRecord, optionalEnum, requireUuidField } from "../http/validate.js";
import {
  countDms,
  createMembership,
  deleteMembership,
  findMembershipById,
  findMemberships,
  updateMembership,
} from "./campaign-memberships.queries.js";

const ROLES = Object.values(CampaignRole);

export async function createMembershipService(rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CampaignMembershipUncheckedCreateInput = {
    campaignId: requireUuidField(body, "campaignId"),
    playerId: requireUuidField(body, "playerId"),
  };
  const role = optionalEnum(body, "role", ROLES);
  if (role !== undefined) data.role = role;

  try {
    return await createMembership(data);
  } catch (error) {
    // Duplicate (campaign, player) -> P2002 -> 409; bad FK -> P2003 -> 400.
    mapPrismaError(error);
  }
}

export function listMembershipsService(filter: {
  campaignId?: string;
  playerId?: string;
}) {
  const where: Prisma.CampaignMembershipWhereInput = {};
  if (filter.campaignId !== undefined) where.campaignId = filter.campaignId;
  if (filter.playerId !== undefined) where.playerId = filter.playerId;
  return findMemberships(where);
}

export async function getMembershipService(id: string) {
  const row = await findMembershipById(id);
  if (!row) throw notFound();
  return row;
}

// Guard the "≥1 DM per campaign" invariant: refuse to demote the last DM.
async function assertNotLastDm(current: {
  campaignId: string;
  role: CampaignRole;
}): Promise<void> {
  if (current.role !== CampaignRole.DUNGEON_MASTER) return;
  if ((await countDms(current.campaignId)) <= 1) throw conflict();
}

export async function updateMembershipService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const role = optionalEnum(body, "role", ROLES);
  if (role === undefined) {
    // Nothing to change; return the current row (404 if absent).
    return getMembershipService(id);
  }

  const current = await findMembershipById(id);
  if (!current) throw notFound();
  // Demoting a DM to PLAYER must not empty the campaign's DM seat.
  if (role !== CampaignRole.DUNGEON_MASTER) {
    await assertNotLastDm(current);
  }

  try {
    return await updateMembership(id, { role });
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteMembershipService(id: string): Promise<void> {
  const current = await findMembershipById(id);
  if (!current) throw notFound();
  await assertNotLastDm(current);
  try {
    await deleteMembership(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

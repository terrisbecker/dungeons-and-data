import { CampaignStatus, Prisma } from "@prisma/client";
import { conflict, notFound } from "../http/http-error.js";
import { mapPrismaError } from "../http/prisma-errors.js";
import {
  asRecord,
  optionalEnum,
  optionalString,
  requireString,
} from "../http/validate.js";
import {
  createCampaign,
  deleteCampaign,
  findCampaignById,
  findCampaigns,
  joinCampaignAsPlayer,
  updateCampaign,
} from "./campaigns.queries.js";

const STATUSES = Object.values(CampaignStatus);

// The creator (passed from the controller's req.auth) is auto-seated as DM.
export async function createCampaignService(
  rawBody: unknown,
  creatorPlayerId: string,
) {
  const body = asRecord(rawBody);
  const data: Prisma.CampaignCreateInput = {
    name: requireString(body, "name"),
  };
  const description = optionalString(body, "description");
  if (description !== undefined) data.description = description;
  const status = optionalEnum(body, "status", STATUSES);
  if (status !== undefined) data.status = status;

  try {
    return await createCampaign(data, creatorPlayerId);
  } catch (error) {
    mapPrismaError(error);
  }
}

export function listCampaignsService() {
  return findCampaigns();
}

export async function getCampaignService(id: string) {
  const row = await findCampaignById(id);
  if (!row) throw notFound();
  return row;
}

// Self-service join: seat the current player as a PLAYER in the campaign. The
// playerId comes from the caller's token (not the body), so a user can only ever
// add themselves — hence no DM/Admin guard on the route.
export async function joinCampaignService(
  campaignId: string,
  playerId: string,
) {
  // Resolve the pasted id to a real campaign first so a bad/unknown id is a
  // clear 404 rather than a generic foreign-key 400.
  const campaign = await findCampaignById(campaignId);
  if (!campaign) throw notFound();

  try {
    return await joinCampaignAsPlayer(campaignId, playerId);
  } catch (error) {
    // Unique (campaign, player) violation -> already a member.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("You are already a member of this campaign.");
    }
    mapPrismaError(error);
  }
}

export async function updateCampaignService(id: string, rawBody: unknown) {
  const body = asRecord(rawBody);
  const data: Prisma.CampaignUncheckedUpdateInput = {};
  const name = optionalString(body, "name");
  if (name !== undefined) data.name = name;
  const description = optionalString(body, "description");
  if (description !== undefined) data.description = description;
  const status = optionalEnum(body, "status", STATUSES);
  if (status !== undefined) data.status = status;

  try {
    return await updateCampaign(id, data);
  } catch (error) {
    mapPrismaError(error);
  }
}

export async function deleteCampaignService(id: string): Promise<void> {
  try {
    await deleteCampaign(id);
  } catch (error) {
    mapPrismaError(error);
  }
}

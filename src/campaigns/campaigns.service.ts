import { CampaignStatus, Prisma } from "@prisma/client";
import { notFound } from "../http/http-error.js";
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
